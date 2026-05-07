const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require('bcrypt');
const Seller = require("../models/Seller");
const Coupon = require("../models/Coupons");
const authenticateUser = require("../middleware/authMiddleware");
const authenticateSeller = require("../middleware/sellerAuthMiddleware");

const router = express.Router();

router.put("/updateDetails/:userId", async (req, res) => {
  const { name, email } = req.body;
  const {userId} = req.params;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { username: name, email },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    var token = jwt.sign(
      {
        userID: updatedUser._id,
        email: updatedUser.email,
        username: updatedUser.username,
        phone: updatedUser.phone,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15d" }
    );

    res.cookie("token", token).status(200).json({
      success: true,
      message: "User details updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

router.post("/saveAddress", authenticateUser, async (req, res) => {
  const { address } = req.body;
  const userId = req.user._id;

  try {
    const existingUser = await User.findOne({ _id: userId });

    if (!existingUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    const isDuplicate = existingUser.addresses.some(
      (addr) =>
        addr.fullName === address.fullName &&
        addr.addressLine === address.addressLine &&
        addr.phone === address.phone &&
        addr.area === address.area
    );

    if (isDuplicate) {
      return res.json({
        success: false,
        message: "Duplicate address. Address already exists!",
      });
    }

    if (address.isDefault) {
      existingUser.addresses.forEach((addr) => (addr.isDefault = false));
      existingUser.addresses.unshift(address);
    } else {
      existingUser.addresses.push(address);
    }

    await existingUser.save();

    res
      .status(200)
      .json({ success: true, message: "Address saved successfully." });
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

router.get("/getAddresses", async (req, res) => {
  const { userId } = req.query;

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({
      success: false,
    });
  }
});

router.delete("/deleteAddress", async (req, res) => {
  const { userId, addressId } = req.query;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    user.addresses = user.addresses.filter(
      (address) => address._id.toString() !== addressId
    );

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

router.put("/setAsDefault", async (req, res) => {
  const { userId, addressId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    const addressIndex = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressId
    );
    if (addressIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found." });
    }

    user.addresses = user.addresses.map((address, index) => {
      if (index === addressIndex) {
        address.isDefault = true;
      } else {
        address.isDefault = false;
      }
      return address;
    });

    const defaultAddress = user.addresses.splice(addressIndex, 1)[0];
    user.addresses.unshift(defaultAddress);

    await user.save();

    res.status(200).json({
      success: true,
      message: "Default address updated successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

router.get("/getDefaultAddress/:userId", async (req, res) => {
  const { userId } = req.params;

  const user = await User.findOne({ _id: userId });

  if (user.addresses.length > 0) {
    const defaultAddress = user.addresses.filter(
      (address) => address.isDefault === true
    );
    res.status(200).json({ success: true, defaultAddress });
  } else {
    res.json({ success: false, message: "No default address found!" });
  }
});

router.post("/editAddress", async (req, res) => {
  const { userId, addressId, formData } = req.body;

  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    const addressIndex = user.addresses.findIndex(
      (address) => address._id.toString() === addressId
    );

    if (addressIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found." });
    }

    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex].toObject(),
      ...formData, // Override with new data
    };

    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Address updated successfully." });
  } catch (error) {
    console.error("Error updating address:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update address." });
  }
});

router.put("/change-password/:userId", async (req, res) => {
  const { password, newPassword } = req.body;
  const {userId} = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log(error)
    res.status(500).json({ success: false, message: "Server error" });
  }
}); 

router.put("/change-seller-password", authenticateSeller, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  try {
    const seller = req.seller; 

    if (!seller) {
      return res
        .status(404)
        .json({ success: false, message: "Seller not found" });
    }

    // Check current password
    const match = await bcrypt.compare(currentPassword, seller.password);
    if (!match) {
      return res.json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    seller.password = hashedPassword;
    await seller.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully!",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

router.post("/assign-coupons", async (req, res) => {
  try {
    const { phone, coupons } = req.body; 

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    for (let c of coupons) {
      const couponDoc = await Coupon.findOne({ name: c.name });
      if (!couponDoc) {
        return res.status(400).json({ success: false, message: `Coupon ${c.name} not found` });
      }

      user.activeCoupons.push({ coupon: couponDoc._id, count: c.count || 1 });
    }

    await user.save();
    res.json({ success: true, message: "Coupons assigned", activeCoupons: user.activeCoupons });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/active-coupons", authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;

    // Populate coupon details
    const user = await User.findById(userId).populate("activeCoupons.coupon");
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      activeCoupons: user.activeCoupons || []
    });
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/register-token", authenticateUser, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token)
      return res.status(400).json({ message: "FCM token is required" });

    const userId = req.user._id || req.user.id;

    console.log(`Registering FCM token for user ${userId}: ${token.substring(0, 20)}...`);

    // Remove token if it exists and push to the end, keeping only the last 3
    await User.updateOne(
      { _id: userId },
      { $pull: { fcmTokens: token } }
    );
    await User.updateOne(
      { _id: userId },
      { 
        $push: { 
          fcmTokens: { 
            $each: [token], 
            $slice: -3 
          } 
        } 
      }
    );

    console.log(`FCM token saved for user ${userId}`);

    res.status(200).json({
      success: true,
      message: "✅ Push token registered successfully",
    });
  } catch (err) {
    console.error("Push Token Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save push token",
    });
  }
});


router.post("/logout-token", authenticateUser, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token required" });

    const userId = req.user._id || req.user.id;
    console.log(`Removing FCM token for user ${userId}: ${token.substring(0, 20)}...`);

    await User.updateOne({ _id: userId }, { $pull: { fcmTokens: token } });

    res.status(200).json({ success: true, message: "Push token removed" });
  } catch (err) {
    console.error("Logout Token Error:", err);
    res.status(500).json({ success: false, message: "Failed to remove token" });
  }
});

module.exports = router;
