const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  lat: { type: String, required: true },
  long: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  addressLine: { type: String, required: true },
  area: { type: String, required: true },
  landMark: { type: String },
  isDefault: { type: Boolean, default: false },
});

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      default: "",
    },
    isSeller: { type: Boolean, default: false },
    addresses: [addressSchema],
    foodCart: [
      {
        productId: { type: String },
        quantity: { type: Number, default: 1 },
      },
    ],
    groceryCart: [
      {
        productId: { type: String },
        quantity: { type: Number, default: 1 },
      },
    ],
    notifications: [
      {
        message: { type: String },
        read: { type: Boolean, default: false },
        url: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    activeCoupons: [
      {
        coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
        count: { type: Number, default: 1 },
      },
    ],
    fcmTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

module.exports = User;
