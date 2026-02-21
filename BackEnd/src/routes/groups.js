const express = require("express");
const crypto = require("crypto");
const { userAuth } = require("../middleware/adminAuth");
const Group = require("../models/group");
const User = require("../models/user");
const Wallet = require("../models/wallet");

const groupsRouter = express.Router();

// Create a new event/group
groupsRouter.post("/", userAuth, async (req, res) => {
  try {
    const { name, description, depositAmountPerPerson, currency } = req.body;

    if (!name || !depositAmountPerPerson) {
      return res.status(400).json({
        success: false,
        message: "'name' and 'depositAmountPerPerson' are required",
      });
    }

    if (typeof depositAmountPerPerson !== "number" || depositAmountPerPerson <= 0) {
      return res.status(400).json({
        success: false,
        message: "'depositAmountPerPerson' must be a positive number",
      });
    }

    const groupFinternetId = `POOL_${crypto.randomBytes(6).toString("hex")}`;

    // Create pool wallet record (internal) and link to group
    const poolWallet = await Wallet.create({
      type: "pool",
      finternetWalletId: groupFinternetId,
      currency: currency || "INR",
      balance: 0,
      status: "active",
    });

    const group = await Group.create({
      name,
      description,
      admin: req.user._id,
      depositAmountPerPerson,
      currency: currency || "INR",
      finternetWalletId: groupFinternetId,
      poolWallet: poolWallet._id,
      participants: [
        {
          user: req.user._id,
          role: "admin",
          deposited: false,
          depositAmount: 0,
          depositCurrency: currency || "INR",
        },
      ],
      status: "open",
      totals: { deposited: 0, spent: 0, remaining: 0 },
    });

    // Link group to creator's user record
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { groups: group._id },
    });

    // Log created group details to server terminal
    console.log("[Groups] Created group:", {
      id: group._id?.toString?.() || group._id,
      name: group.name,
      description: group.description,
      admin: req.user._id?.toString?.() || req.user._id,
      depositAmountPerPerson: group.depositAmountPerPerson,
      currency: group.currency,
      participants: group.participants?.length,
      status: group.status,
    });

    return res.status(201).json({
      success: true,
      message: "Group created",
      group,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// Get groups for current user (created or joined)
groupsRouter.get("/my", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({
      $or: [
        { admin: userId },
        { "participants.user": userId },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Join a group by ID (from invite link)
groupsRouter.post("/join", userAuth, async (req, res) => {
  try {
    const { groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ success: false, message: "groupId is required" });
    }
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const alreadyMember = group.participants.some(p => p.user.toString() === req.user._id.toString());
    if (!alreadyMember) {
      group.participants.push({
        user: req.user._id,
        role: "member",
        deposited: false,
        depositAmount: 0,
        depositCurrency: group.currency || "INR",
      });
      await group.save();

      // Link group to the joining user's record
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { groups: group._id },
      });
    }

    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = groupsRouter;
