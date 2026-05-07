const mongoose = require("mongoose");

const deliveryAlertSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      unique: true,
    },
    priority: {
      type: Number,
      default: 1,
    },

    isHappening: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const DeliveryAlert = mongoose.model(
  "DeliveryAlert",
  deliveryAlertSchema
);

module.exports = DeliveryAlert;