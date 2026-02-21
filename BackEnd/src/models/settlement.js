const mongoose = require("mongoose");

const perUserSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    txn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  },
  { _id: false }
);

const settlementSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    triggeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    perUser: {
      type: [perUserSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    settledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SettlementRecord", settlementSchema);
