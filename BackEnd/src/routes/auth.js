const express = require("express");
const jwt = require("jsonwebtoken");
const { userAuth } = require("../middleware/adminAuth");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { validateSignUpData } = require("../utils/validation");
authRouter.post("/signup", async (req, res) => {
  try {

    // validate request body
    validateSignUpData(req);

    const {
      firstName,
      lastName,
      emailId,
      password,
      gender,
      age,
      photoUrl,
      about,
      location,
    } = req.body;

    // hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // create user
    const user = new User({
      firstName,
      lastName,
      emailId,
      password: passwordHash,
      gender,
      age,
      photoUrl,
      about,
      location,
    });

    const savedUser = await user.save();

    // remove password before sending response
    savedUser.password = undefined;

    res.status(201).json({
      message: "User registered successfully",
      user: savedUser,
    });
  } catch (err) {
    res.status(400).json({
      message: "Error adding user",
      error: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    console.log("Rigved1");

    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "EMAIL NOT FOUND",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "INCORRECT PASSWORD",
      });
    }

    const token = jwt.sign({ _id: user._id }, "Arpitttt");

    // set cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    // remove password before sending user
    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: "LOGIN SUCCESS",
      user: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});


authRouter.get("/profile", userAuth, async (req, resp) => {
  try {
    const userbyid = req.user;
    console.log("Rigved");

    // console.log(userbyid);
    resp.send(userbyid);
  } catch (err) {
    resp.status(400).send("ERROR: " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
  });
  res.send("Log out Sucess");
});

module.exports = authRouter;
