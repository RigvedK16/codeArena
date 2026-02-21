const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ["ocr", "manual"],
      default: "ocr",
    },
    rawText: {
      type: String,
    },
    fileUrl: {
      type: String,
    },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
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
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Merchant",
    },
    paymentTxn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
    bill: billSchema,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
