const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
    },
    finternetWalletId: {
      type: String,
      unique: true,
      sparse: true,
    },
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
  },
  { timestamps: true }
);

merchantSchema.index({ finternetWalletId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Merchant", merchantSchema);
