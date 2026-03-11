require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.mongoURI);
  const users = await User.find({ role: { $in: ["admin", "recruiter", "bgv", "manager"] } })
    .select("_id name email role empId")
    .sort({ role: 1 })
    .lean();

  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
