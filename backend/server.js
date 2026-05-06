const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const colors = require("colors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const shopRoutes = require("./routes/shopRoutes");
const userProfileRoutes = require("./routes/userProfileRoutes");
const homeRoutes = require("./routes/homeRoutes");
const commonRoutes = require("./routes/commonRoutes");
const cartRoutes = require("./routes/cartRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const orderRoutes = require("./routes/orderRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const groceryRoutes = require("./routes/groceryRoutes");
const multer = require("multer");
const axios = require("axios");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary.js");
const cronRoutes = require("./routes/cronRoutes.js");
const QRCode = require("qrcode");
const Coupons = require("./models/Coupons.js");
const Shop = require("./models/Shop.js");
const pdfExportRoutes = require("./routes/pdfExportRoutes");
const rateLimit = require("express-rate-limit");
const Product = require("./models/Product.js");
const User = require("./models/User.js");

const app = express();
dotenv.config();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:3000",
      "https://door-dash-sigma.vercel.app",
      "https://gullyfoods.app",
    ],
    methods: ["POST", "PUT", "GET", "DELETE"],
  }),
);

app.use(
  rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

console.log("ENV VALUE:", process.env.MONGODB_URI_KEY);

mongoose
  .connect(process.env.MONGODB_URI_KEY, {
    dbName: "doordash",
  })
  .then(() => {
    console.log("Database connected".yellow.bold);
  })
  .catch((err) => {
    console.error("Mongo Error:", err);
  });

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "gullyfoods_uploads",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  },
});

const upload = multer({ storage });

app.post("/upload", upload.array("photos"), async (req, res) => {
  try {
    const uploadedFiles = req.files.map((file) => file.path);

    res.status(200).json({ success: true, files: uploadedFiles });
  } catch (error) {
    console.error("Error uploading files:", error);
    res.status(500).json({
      success: false,
      message: "File upload failed.",
      error,
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/user-profile", userProfileRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/common", commonRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/notification", notificationsRoutes);
app.use("/api/grocery", groceryRoutes);
app.use("/api/export", pdfExportRoutes);

app.get("/api/check", async (req, res) => {
  res.send({ succes: true, message: "Backend connected" });
});

app.use("/api/admin", adminRoutes);

app.use("/api/delivery", deliveryRoutes);

app.get("/api/location/reverse-geocode", async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const { data } = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      {
        headers: {
          "User-Agent": "YourAppName/1.0 (your@email.com)",
        },
      },
    );

    res.json({ success: true, address: data.display_name });
  } catch (err) {
    console.error("Nominatim error:", err.message);
    res
      .status(500)
      .json({ success: false, message: "Reverse geocoding failed" });
  }
});

app.get("/promo/qr", async (req, res) => {
  try {
    // Generate the URL you want the QR to redirect to
    const promoUrl = `https://gullyfoods.app`;

    // Generate QR as a PNG buffer
    const qrImageBuffer = await QRCode.toBuffer(promoUrl, {
      type: "png",
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    // Set headers and send image
    res.setHeader("Content-Type", "image/png");
    res.send(qrImageBuffer);
  } catch (error) {
    console.error("Error generating QR:", error);
    res.status(500).json({ success: false, message: "Failed to generate QR" });
  }
});

app.post("/add-coupons", async (req, res) => {
  try {
    const { coupons } = req.body;

    if (!Array.isArray(coupons) || coupons.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Coupons array required" });
    }

    const insertedCoupons = await Coupons.insertMany(coupons, {
      ordered: false,
    });
    res.json({ success: true, insertedCoupons });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Error inserting coupons",
      error: err.message,
    });
  }
});

app.put("/close-all-shops", async (req, res) => {
  try {
    const result = await Shop.updateMany({}, { $set: { isOpen: false } });

    res.json({
      success: true,
      message: "All shops have been marked as closed.",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error closing shops:", err);
    res.status(500).json({
      success: false,
      message: "Failed to close all shops.",
    });
  }
});

app.put("/open-all-shops", async (req, res) => {
  try {
    const result = await Shop.updateMany({}, { $set: { isOpen: true } });

    res.json({
      success: true,
      message: "All shops have been marked as open.",
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("Error closing shops:", err);
    res.status(500).json({
      success: false,
      message: "Failed to open all shops.",
    });
  }
});

app.put("/init-shop-fields", async (req, res) => {
  try {
    const result = await Shop.updateMany(
      {},
      {
        $set: {
          shopDiscount: 0,
        },
      },
    );

    return res.status(200).json({
      success: true,
      message: "Missing fields initialized successfully",
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("INIT SHOP FIELDS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Update failed",
      error: error.message,
    });
  }
});

app.post("/update-prices-by-shop", async (req, res) => {
  try {
    const { shopName, increasePercent } = req.body;

    if (!shopName || typeof increasePercent !== "number") {
      return res.status(400).json({
        success: false,
        message: "shopName and increasePercent are required",
      });
    }

    if (increasePercent < 0 || increasePercent > 100) {
      return res.status(400).json({
        success: false,
        message: "increasePercent must be between 0 and 100",
      });
    }

    const products = await Product.find({ shopName });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found for this shop",
      });
    }

    let updatedCount = 0;

    for (const product of products) {
      if (!product.basePrice || product.basePrice <= 0) continue;

      const newPrice = Math.round(
        product.basePrice * (1 + increasePercent / 100),
      );

      product.price = newPrice;
      await product.save();

      updatedCount++;
    }

    return res.json({
      success: true,
      shopName,
      increasePercent,
      totalProducts: products.length,
      updatedProducts: updatedCount,
      message: `Updated prices for ${updatedCount} products`,
    });
  } catch (error) {
    console.error("Update price error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.post("/update-prices-by-category", async (req, res) => {
  try {
    const { shopName, categories, percent } = req.body;

    if (!shopName || !categories?.length || !percent) {
      return res.status(400).json({
        success: false,
        message: "shopName, categories and percent are required",
      });
    }

    const products = await Product.find({
      shopName,
      categories: { $in: categories },
    });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No matching products found",
      });
    }

    let updatedCount = 0;

    for (const product of products) {
      if (!product.basePrice) continue;

      const newPrice = Math.round(
        product.basePrice + (product.basePrice * percent) / 100,
      );

      product.price = newPrice;
      await product.save();
      updatedCount++;
    }

    res.json({
      success: true,
      message: "Prices updated successfully",
      shopName,
      categories,
      percent,
      updatedProducts: updatedCount,
    });
  } catch (err) {
    console.error("Shop-category price update error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.put("/increase-baseprice", async (req, res) => {
  try {
    const { shopName, category } = req.body;

    if (!shopName || !category) {
      return res.status(400).json({
        success: false,
        message: "shopName and category are required",
      });
    }

    const result = await Product.updateMany(
      {
        shopName: shopName,
        "categories.0": category,
      },
      {
        $inc: { basePrice: -10 },
      },
    );

    res.status(200).json({
      success: true,
      message: "Base price updated successfully",
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

app.listen(5000, () => {
  console.log(`Server is running on PORT 5000`.blue);
});
