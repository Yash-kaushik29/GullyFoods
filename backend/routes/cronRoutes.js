const express = require("express");
const cron = require("node-cron");
const DeliveryBoy = require("../models/DeliveryBoy");
const Order = require("../models/Order");
const Seller = require("../models/Seller");
const User = require("../models/User");
const Shop = require("../models/Shop");
const ArchivedOrder = require("../models/ArchivedOrder");
const Wallet = require("../models/Wallet");

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const isShopOpenNow = (current, open, close) => {
  if (open < close) {
    return current >= open && current < close;
  }

  return current >= open || current < close;
};

cron.schedule("0 1 * * *", async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);

    const result = await DeliveryBoy.updateMany(
      {},
      { $pull: { commissionHistory: { time: { $lt: cutoffDate } } } },
    );

    console.log(
      `✅ Commission cleanup ran at 2 AM. Modified ${result.modifiedCount} records.`,
    );
  } catch (error) {
    console.error("❌ Error clearing commissions:", error);
  }
});

cron.schedule("0 2 * * *", async () => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);

    const oldOrders = await Order.find({ createdAt: { $lt: cutoffDate } });

    if (!oldOrders.length) {
      console.log("🗑️ No orders older than 3 months to archive.");
      return;
    }

    const oldOrderIds = oldOrders.map((order) => order._id);

    const archivedOrders = oldOrders.map((order) => ({
      id: order.id,
      amount: order.amount,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
    }));

    await ArchivedOrder.insertMany(archivedOrders);

    const result = await Order.deleteMany({ _id: { $in: oldOrderIds } });

    await User.updateMany(
      { orders: { $in: oldOrderIds } },
      { $pull: { orders: { $in: oldOrderIds } } },
    );

    await Seller.updateMany(
      { orders: { $in: oldOrderIds } },
      { $pull: { orders: { $in: oldOrderIds } } },
    );

    console.log(
      `📦 Archived ${archivedOrders.length} orders and deleted ${result.deletedCount} old orders.`,
    );
  } catch (error) {
    console.error("❌ Error archiving old orders:", error);
  }
});

cron.schedule("0 3 * * *", async () => {
  try {
    const now = new Date();

    // Cutoff dates
    const salesCutoff = new Date(now);
    salesCutoff.setMonth(salesCutoff.getMonth() - 3);

    const notificationsCutoff = new Date(now);
    notificationsCutoff.setDate(notificationsCutoff.getDate() - 7);

    // 1️⃣ Remove old salesHistory (older than 3 months)
    await Seller.updateMany(
      {},
      { $pull: { salesHistory: { date: { $lt: salesCutoff } } } },
    );

    // 2️⃣ Remove old notifications (older than 1 week)
    await Seller.updateMany(
      {},
      { $pull: { notifications: { createdAt: { $lt: notificationsCutoff } } } },
    );

    console.log("✅ [3 AM] Seller cleanup completed successfully.");
  } catch (error) {
    console.error("❌ Error running seller cleanup:", error);
  }
});

cron.schedule(
  "1,31 * * * *",
  async () => {
    try {
      const now = new Date();

      const istTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
      );

      const currentMinutes = istTime.getHours() * 60 + istTime.getMinutes();

      const shops = await Shop.find();

      for (const shop of shops) {
        if (shop.isManuallyClosed) continue;

        const openMinutes = timeToMinutes(shop.openingTime);
        const closeMinutes = timeToMinutes(shop.closingTime);

        const shouldBeOpen = isShopOpenNow(
          currentMinutes,
          openMinutes,
          closeMinutes,
        );

        if (shop.isOpen !== shouldBeOpen) {
          shop.isOpen = shouldBeOpen;
          await shop.save();
        }
      }

      console.log(
        "✅ Shops auto-updated at",
        istTime.toLocaleTimeString("en-IN"),
      );
    } catch (err) {
      console.error("❌ Shop cron error:", err.message);
    }
  },
  {
    timezone: "Asia/Kolkata",
  },
);

cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    
    // Find all wallets where premium has expired
    const expiredWallets = await Wallet.find({
      isPremium: true,
      premiumExpiryDate: { $lte: now }
    });

    for (const wallet of expiredWallets) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentOrdersCount = await Order.countDocuments({
        user: wallet.user,
        createdAt: { $gte: thirtyDaysAgo }
      });

      if (recentOrdersCount >= 3) {
        // Extend premium for another 30 days
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);
        wallet.premiumExpiryDate = newExpiry;
      } else {
        // Revoke premium
        wallet.isPremium = false;
        wallet.premiumExpiryDate = null;
      }
      
      await wallet.save();
    }
    
    console.log(`✅ Daily Premium check completed. Processed ${expiredWallets.length} wallets.`);
  } catch (error) {
    console.error("❌ Error running premium cron:", error);
  }
});


