const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email address");
        }
      },
    },

    password: {
      type: String,
      required: true,
    },

    age: {
      type: Number,
      min: 18,
    },

    gender: {
      type: String,
      enum: ["male", "female", "others"],
      required: true,
    },

    photoUrl: {
      type: String,
      default: "https://geographyandyou.com/images/user-profile.png",
      validate(value) {
        if (!validator.isURL(value)) {
          throw new Error("Invalid photo URL");
        }
      },
    },

    location: {
      city: String,
      country: String,
    },

    verified: {
      type: Boolean,
      default: false,
    },

    finternetWalletId: {
      type: String,
      unique: true,
      sparse: true,
    },

    walletSecretEncrypted: {
      type: String,
    },

    primaryWallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },

    // Groups the user has created or joined
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ finternetWalletId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", userSchema);
