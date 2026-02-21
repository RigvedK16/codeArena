// const adminAuth = (req, resp, next) => {
//   console.log("Check authh");
//   const token = "xyz";
//   const isauthorised = token === "xyz";
//   if (!isauthorised) {
//     req.send("ERROR");
//   } else {
//     console.log("Passing to next");
//     next();
//   }
// };
const jwt = require("jsonwebtoken");

const User = require("../models/user");

const JWT_SECRET = "Arpitttt";

const userAuth = async (req, resp, next) => {
  try {
    const cookies = req.cookies;
    console.log(cookies);
    const { token } = cookies;
    if (!token) {
      throw new Error("No tokens Error");
    }
    //validate the token
    const decodedMessage = await jwt.verify(token, JWT_SECRET);
    console.log(decodedMessage);
    const { _id } = decodedMessage;
    // console.log(_id);
    const userbyid = await User.findById(_id);
    if (!userbyid) {
      throw new Error("No user");
    }
    req.user = userbyid;
    // console.log(userbyid);
    next();
    // resp.send(userbyid);
  } catch (err) {
    resp.status(400).send("ERROR: " + err.message);
  }
};

// Like userAuth, but does not throw when token is missing/invalid.
// Sets req.user when possible.
const optionalUserAuth = async (req, resp, next) => {
  try {
    const { token } = req.cookies || {};
    if (!token) return next();
    const decodedMessage = await jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decodedMessage?._id);
    if (user) req.user = user;
    return next();
  } catch {
    return next();
  }
};

// Requires an authenticated admin user.
const adminAuth = async (req, resp, next) => {
  return userAuth(req, resp, () => {
    try {
      if (req.user?.role !== "admin") {
        return resp
          .status(403)
          .json({ success: false, message: "Admin access required" });
      }
      return next();
    } catch (err) {
      return resp
        .status(500)
        .json({ success: false, message: err?.message || "Server error" });
    }
  });
};
module.exports = {
  // adminAuth,
  userAuth,
  optionalUserAuth,
  adminAuth,
};
