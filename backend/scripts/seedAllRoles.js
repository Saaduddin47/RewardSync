require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const seedUsers = [
  {
    name: "System Admin",
    email: "admin@rewardsync.com",
    password: "Admin@123",
    role: "admin",
    empId: "ADM001",
    quarterlyTarget: 0,
    incentiveCTH: 0,
    incentiveANN: 0,
  },
  {
    name: "Riya Recruiter",
    email: "recruiter@rewardsync.com",
    password: "Recruiter@123",
    role: "recruiter",
    empId: "REC001",
    quarterlyTarget: 10,
    incentiveCTH: 10000,
    incentiveANN: 30000,
  },
  {
    name: "Ben BGV",
    email: "bgv@rewardsync.com",
    password: "Bgv@123",
    role: "bgv",
    empId: "BGV001",
    quarterlyTarget: 0,
    incentiveCTH: 0,
    incentiveANN: 0,
  },
  {
    name: "Maya Manager",
    email: "manager@rewardsync.com",
    password: "Manager@123",
    role: "manager",
    empId: "MGR001",
    quarterlyTarget: 0,
    incentiveCTH: 0,
    incentiveANN: 0,
  },
];

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.mongoURI);

  for (const userData of seedUsers) {
    const found = await User.findOne({ email: userData.email });
    if (!found) {
      await User.create({ ...userData, doj: new Date() });
    }
  }

  const users = await User.find({ role: { $in: ["admin", "recruiter", "bgv", "manager"] } })
    .select("_id name email role empId")
    .sort({ role: 1 })
    .lean();

  const passwordMap = Object.fromEntries(seedUsers.map((user) => [user.email, user.password]));
  const output = users.map((user) => ({ ...user, password: passwordMap[user.email] }));

  console.log(JSON.stringify(output, null, 2));
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
