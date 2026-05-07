const express = require("express");
const Order = require("../models/Order");
const DeliveryBoy = require("../models/DeliveryBoy");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Seller = require("../models/Seller");
const Product = require("../models/Product");
const User = require("../models/User");
const mongoose = require("mongoose");
const { sendOrderStatusNotification } = require("../config/firebase.config");

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  const { username, phone, password, secretKey } = req.body;

  if (secretKey !== process.env.DELIVERY_SECRET_KEY) {
    return res.status(403).json({ message: "Invalid secret key" });
  }

  try {
    const existingUser = await DeliveryBoy.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new DeliveryBoy({
      name: username,
      phone,
      password: hashedPassword,
      fcmTokens: req.body.fcmToken ? [req.body.fcmToken] : [],
    });
    await newUser.save();
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  try {
    const user = await DeliveryBoy.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(403).json({ message: "Invalid credentials" });
    }

    var token = jwt.sign(
      {
        id: user._id,
        phone: user.phone || "",
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" },
    );

    // ✅ Store FCM token if provided - in background
    if (req.body.fcmToken) {
      (async () => {
        try {
          await DeliveryBoy.updateOne(
            { _id: user._id },
            { $pull: { fcmTokens: req.body.fcmToken } }
          );
          await DeliveryBoy.updateOne(
            { _id: user._id },
            { 
              $push: { 
                fcmTokens: { 
                  $each: [req.body.fcmToken], 
                  $slice: -3 
                } 
              } 
            }
          );
        } catch (err) {
          console.error("Error saving Delivery Boy FCM token during login:", err);
        }
      })();
    }

    res.json({ success: true, message: "Login successful", token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get orders for the delivery boy
router.get("/orders/:deliveryBoyId", async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;

    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId);

    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    const orders = await Order.find({ deliveryBoy: deliveryBoyId })
      .select("deliveryStatus")
      .lean();

    // Default response if no orders
    if (!orders.length) {
      return res.json({
        pendingOrders: 0,
        commission: 0, // nothing earned
      });
    }

    const pendingOrders = orders.filter(
      (order) => !["Delivered", "Cancelled"].includes(order.deliveryStatus),
    ).length;

    // ---- Calculate today's commission ----
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysCommissions = deliveryBoy.commissionHistory.filter(
      (entry) => entry.time >= startOfDay && entry.time <= endOfDay,
    );

    const todayCommission = todaysCommissions.reduce(
      (sum, entry) => sum + (entry.commission || 0),
      0,
    );

    res.json({
      outstandingAmount: deliveryBoy.outstandingAmount,
      pendingOrders,
      commission: todayCommission,
    });
  } catch (error) {
    console.error("Error fetching delivery boy orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/outstandingAmounts/:deliveryBoyId", async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;

    const deliveryBoy = await DeliveryBoy.findById(deliveryBoyId).populate({
      path: "outstandingPayments.orderId",
      select: "id",
    });

    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    res.json({
      success: true,
      outstandingPayments: deliveryBoy.outstandingPayments,
    });
  } catch (error) {
    console.error("Error fetching outstanding amounts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/orders", async (req, res) => {
  const { page = 1, limit = 10, status, deliveryBoyId } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {};

  if (deliveryBoyId) filter.deliveryBoy = deliveryBoyId; // Add index-based query optimization
  if (status) {
    if (status.toLowerCase() === "delivered") {
      filter.deliveryStatus = "Delivered";
    } else if (status.toLowerCase() === "pending") {
      filter.deliveryStatus = { $nin: ["Delivered", "Cancelled"] }; // Fix condition
    }
  }

  try {
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .select("id totalAmount paymentStatus deliveryStatus createdAt items")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter),
    ]);

    res.json({
      orders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-available-orders", async (req, res) => {
  try {
    const availableOrders = await Order.find({
      deliveryBoyAssigned: false,
    })
      .populate("user", "username phone")
      .populate("items.product", "name shopName")
      .populate("items.seller", "username shop");

    res.json({
      success: true,
      orders: availableOrders,
    });
  } catch (error) {
    console.error("Error fetching available orders:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/orders/:orderId/accept", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { deliveryBoyId } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (order.deliveryBoyAssigned || order.deliveryBoy) {
      return res
        .status(400)
        .json({ success: false, message: "Order already assigned" });
    }

    await Order.updateOne(
      { _id: orderId },
      { deliveryBoy: deliveryBoyId, deliveryBoyAssigned: true },
    );
    await order.save();

    res.json({ success: true, message: "Order accepted", order });
  } catch (error) {
    console.error("Error accepting order:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/order/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .select(
        "items user deliveryStatus createdAt shippingAddress id totalAmount paymentStatus",
      )
      .populate("items.product", "name shopName")
      .populate("user", "name email")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/order/confirm-pickup", async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.items = order.items.map((item) => ({
      ...item,
      status: "Out For Delivery",
    }));

    order.deliveryStatus = "Out For Delivery";

    await order.save();

    // ✅ Send push notification to user (out for delivery) - in background
    sendOrderStatusNotification(order.user, order.id, order._id, "Out For Delivery");

    res.json({
      success: true,
      message: "Order marked as Out For Delivery!",
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/order/confirm-delivery/:orderId", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("deliveryBoy")
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    // ⭐ Prevent double delivery
    if (order.deliveryStatus === "Delivered") {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Order already delivered",
      });
    }

    // 1️⃣ Update order status
    order.deliveryStatus = "Delivered";
    order.paymentStatus = "Paid";

    order.items = order.items.map((item) => ({
      ...item.toObject(),
      status: item.status !== "Cancelled" ? "Delivered" : item.status,
    }));

    // 2️⃣ Calculate seller earnings
    const sellerSalesMap = {};

    for (const item of order.items) {
      if (item.status !== "Cancelled" && item.product?.seller) {
        const sellerId = item.product.seller.toString();
        const unitPrice =
          order.orderType === "Food"
            ? item.product.basePrice
            : item.product.price;

        const amount = item.quantity * parseFloat(unitPrice);

        sellerSalesMap[sellerId] = (sellerSalesMap[sellerId] || 0) + amount;
      }
    }

    // 3️⃣ Update sellers
    for (const sellerId in sellerSalesMap) {
      const seller = await Seller.findById(sellerId).session(session);
      if (!seller) continue;

      const totalAmount = sellerSalesMap[sellerId];
      const commissionRate = seller.commissionRate || 0;
      const sellerEarnings = totalAmount * (1 - commissionRate);

      seller.salesHistory.push({
        orderId: order._id,
        amount: sellerEarnings,
        date: new Date(),
      });

      await seller.save({ session });
    }

    // 4️⃣ Update delivery boy
    if (order.deliveryBoy) {
      const deliveryBoy = await DeliveryBoy.findById(
        order.deliveryBoy._id,
      ).session(session);

      if (!deliveryBoy) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Delivery boy not found" });
      }

      // Prevent duplicate commission
      const alreadyRecorded = deliveryBoy.commissionHistory.some(
        (c) => c.orderId?.toString() === orderId,
      );

      if (!alreadyRecorded) {
        deliveryBoy.commissionHistory.push({
          commission:
            (order.deliveryCharge || 0) + (order.convenienceFees || 0),
          date: new Date(),
        });
      }

      // COD handling
      if (order.paymentMethod === "COD") {
        const codExists = deliveryBoy.outstandingPayments.some(
          (p) => p.orderId?.toString() === orderId,
        );

        if (!codExists) {
          const totalCOD = order.totalAmount;

          deliveryBoy.outstandingPayments.push({
            orderId,
            amount: totalCOD,
            collectedAt: new Date(),
          });

          deliveryBoy.outstandingAmount += totalCOD;
        }
      }

      await deliveryBoy.save({ session });
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ Send push notification to user (order delivered) - in background
    sendOrderStatusNotification(order.user, order.id, order._id, "Delivered");

    res.json({
      success: true,
      message: "Order successfully marked as delivered",
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error("Error confirming order delivery:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:deliveryBoyId/commissionHistory", async (req, res) => {
  try {
    const { deliveryBoyId } = req.params;
    const deliveryBoy =
      await DeliveryBoy.findById(deliveryBoyId).select("commissionHistory");

    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy not found" });
    }

    const sortedHistory = deliveryBoy.commissionHistory.sort(
      (a, b) => new Date(b.time) - new Date(a.time),
    );

    res.json({ commissionHistory: sortedHistory });
  } catch (error) {
    console.error("Error fetching commission history:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Register FCM token for delivery boy
router.post("/register-token", async (req, res) => {
  try {
    const { token } = req.body;
    const authHeader = req.headers.authorization;

    if (!token) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const jwtToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    const deliveryBoyId = decoded.id;

    console.log(`Registering FCM token for delivery boy ${deliveryBoyId}: ${token.substring(0, 20)}...`);

    // Remove token if it exists and push to the end, keeping only the last 3
    await DeliveryBoy.updateOne(
      { _id: deliveryBoyId },
      { $pull: { fcmTokens: token } }
    );
    await DeliveryBoy.updateOne(
      { _id: deliveryBoyId },
      { 
        $push: { 
          fcmTokens: { 
            $each: [token], 
            $slice: -3 
          } 
        } 
      }
    );

    console.log(`FCM token saved for delivery boy ${deliveryBoyId}`);

    res.status(200).json({
      success: true,
      message: "Push token registered successfully",
    });
  } catch (err) {
    console.error("Push Token Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save push token",
    });
  }
});

// Logout FCM token for delivery boy
router.post("/logout-token", async (req, res) => {
  try {
    const { token } = req.body;
    const authHeader = req.headers.authorization;

    if (!token) return res.status(400).json({ message: "Token required" });
    if (!authHeader || !authHeader.startsWith("Bearer ")) return res.status(401).json({ message: "Bearer token required" });

    const jwtToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    const deliveryBoyId = decoded.id;

    console.log(`Removing FCM token for delivery boy ${deliveryBoyId}`);
    await DeliveryBoy.updateOne({ _id: deliveryBoyId }, { $pull: { fcmTokens: token } });

    res.status(200).json({ success: true, message: "Token removed" });
  } catch (err) {
    console.error("Delivery Logout Token Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
