const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["fiat", "stablecoin", "pool", "merchant"],
      required: true,
    },

    finternetWalletId: {
      type: String,
      unique: true,
      sparse: true,
    },

    ownerUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },

    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
    },

    currency: {
      type: String,
      default: "INR",
    },

    balance: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["active", "locked", "closed"],
      default: "active",
    },
  },
  { timestamps: true }
);

walletSchema.index({ finternetWalletId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Wallet", walletSchema);
