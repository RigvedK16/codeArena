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

const userAuth = async (req, resp, next) => {
  try {
    const cookies = req.cookies;
    console.log(cookies);
    const { token } = cookies;
    if (!token) {
      throw new Error("No tokens Error");
    }
    //validate the token
    const decodedMessage = await jwt.verify(token, "Arpitttt");
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
module.exports = {
  // adminAuth,
  userAuth,
};