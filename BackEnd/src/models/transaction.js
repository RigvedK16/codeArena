const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["deposit", "transfer", "spend", "settlement", "refund"],
      required: true,
    },
    module: {
      type: String,
      enum: ["fund_locking", "payment", "settlement", "refund"],
      required: true,
    },
    fromWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    toWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    finternetTxnId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    metadata: {
      type: Object,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
