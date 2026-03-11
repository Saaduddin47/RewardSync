const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.mongoURI);
  console.log("MongoDB connected");
};

module.exports = connectDB;
