const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0 },
    isPremium: { type: Boolean, default: false },
    premiumExpiryDate: { type: Date, default: null },
    transactions: [
      {
        amount: { type: Number, required: true },
        type: { type: String, enum: ["Credit", "Debit"], required: true },
        description: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model("Wallet", WalletSchema);

module.exports = Wallet;
