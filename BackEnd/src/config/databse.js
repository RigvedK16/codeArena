const URI = "mongodb+srv://rigved_db_user:Rigved%4016@cluster0.x7wo8ke.mongodb.net/DevHacks";

const mongoose = require("mongoose");
const connectDB = async () => {
  await mongoose.connect(URI);
};
module.exports = connectDB;

// JEUai6JpLj0xsxG3 // mainarpithoon_db_user module.exports = connectDB;
