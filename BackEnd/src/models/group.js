const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    depositAmount: {
      type: Number,
      default: 0,
    },
    depositCurrency: {
      type: String,
      default: "INR",
    },
    deposited: {
      type: Boolean,
      default: false,
    },
    depositTxn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  },
  { _id: false }
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    depositAmountPerPerson: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
    },
    
    // --- NEW FIELD ---
    // This stores the 'POOL_XYZ' string you generate. 
    // You will send THIS string to Finternet as 'settlementDestination'.
    finternetWalletId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    // You can keep this if you use the wallet.js model for internal logic,
    // otherwise you can rely on 'totals' below.
    poolWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },

    participants: {
      type: [participantSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ["open", "active", "settling", "settled", "cancelled"],
      default: "open",
    },
    totals: {
      deposited: { type: Number, default: 0 },
      spent: { type: Number, default: 0 },
      remaining: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index for fast lookups when Finternet sends a webhook or callback
groupSchema.index({ finternetWalletId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Group", groupSchema);