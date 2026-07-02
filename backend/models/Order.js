const mongoose = require("mongoose");

const generateId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "";
  for (let i = 0; i < 6; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
};

const OrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderType: { type: String, required: true, default: "Food" },
    id: { type: String, unique: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: "Seller" },
        quantity: { type: Number, required: true },
        status: { type: String, default: "Processing" },
      },
    ],
    shippingAddress: {
      lat: { type: String, required: true },
      long: { type: String, required: true },
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine: { type: String, required: true },
      area: { type: String, required: true },
      landMark: { type: String },
    },
    totalAmount: { type: Number, required: true },
    amount: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
    convenienceFees: { type: Number, default: 0 },
    serviceCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    walletDiscount: { type: Number, default: 0 },
    deliveryStatus: { type: String, default: "Processing" },
    deliveryCharge: { type: Number, default: 0 },
    orderNote: { type: String },
    expectedDeliveryTime: { type: Date },
    deliveryAlert: {
      type: String,
      default: "",
    },
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "Unpaid" },
    hasReviewed: { type: Boolean, default: false },
    appRatings: { type: Number, default: 0 },
    deliveryRatings: { type: Number, default: 0 },
    overallRatings: { type: Number, default: 0 },
    review: { type: String, default: "" },
    deliveryBoy: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryBoy" },
    deliveryBoyAssigned: { type: Boolean, default: false },
    sellersNotified: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seller" }],
  },
  { timestamps: true },
);

OrderSchema.pre("save", function (next) {
  if (!this.id) {
    this.id = generateId();
  }
  next();
});

const Order = mongoose.model("Order", OrderSchema);

module.exports = Order;
