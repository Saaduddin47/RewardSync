require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const Joiner = require("../models/Joiner");
const BGV = require("../models/BGV");
const IncentiveClaim = require("../models/IncentiveClaim");
const Recovery = require("../models/Recovery");
const { getCurrentQuarter } = require("../services/recoveryService");

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
    name: "Maya Manager",
    email: "manager@rewardsync.com",
    password: "Manager@123",
    role: "manager",
    empId: "MGR001",
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
    name: "Arjun Recruiter",
    email: "recruiter2@rewardsync.com",
    password: "Recruiter2@123",
    role: "recruiter",
    empId: "REC002",
    quarterlyTarget: 8,
    incentiveCTH: 9000,
    incentiveANN: 28000,
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
];

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthsAgo = (count) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() - count);
  return date;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.mongoURI);

  for (const userData of seedUsers) {
    const found = await User.findOne({ email: userData.email });
    if (!found) {
      await User.create({ ...userData, doj: monthsAgo(24) });
    }
  }

  const recruiters = await User.find({ role: "recruiter", email: { $in: ["recruiter@rewardsync.com", "recruiter2@rewardsync.com"] } })
    .select("_id name")
    .lean();
  const recruiterMap = Object.fromEntries(recruiters.map((item) => [item.name, item._id]));

  const bgvUser = await User.findOne({ role: "bgv", email: "bgv@rewardsync.com" }).select("_id").lean();

  const joinerSeed = [
    { joinerName: "Aarav Shah", client: "Acme", skill: "Java", portal: "Naukri", incentiveType: "CTH", recruiter: "Riya Recruiter", joinDate: monthsAgo(14), bgvStatus: "cleared" },
    { joinerName: "Neha Iyer", client: "Acme", skill: "React", portal: "LinkedIn", incentiveType: "FTE", recruiter: "Riya Recruiter", joinDate: monthsAgo(11), bgvStatus: "cleared" },
    { joinerName: "Kabir Khan", client: "Globex", skill: "Node", portal: "Referral", incentiveType: "CTH", recruiter: "Riya Recruiter", joinDate: monthsAgo(8), bgvStatus: "pending" },
    { joinerName: "Ananya Rao", client: "Initech", skill: "Python", portal: "LinkedIn", incentiveType: "ANN", recruiter: "Riya Recruiter", joinDate: monthsAgo(13), bgvStatus: "cleared" },
    { joinerName: "Dev Mehta", client: "Hooli", skill: "DevOps", portal: "Naukri", incentiveType: "CTH", recruiter: "Riya Recruiter", joinDate: monthsAgo(2), bgvStatus: "failed" },
    { joinerName: "Ishita Sen", client: "Acme", skill: "QA", portal: "Referral", incentiveType: "FTE", recruiter: "Riya Recruiter", joinDate: monthsAgo(5), bgvStatus: "cleared" },
    { joinerName: "Rohan Das", client: "Globex", skill: "Java", portal: "Naukri", incentiveType: "CTH", recruiter: "Riya Recruiter", joinDate: monthsAgo(4), bgvStatus: "pending" },
    { joinerName: "Pooja Jain", client: "Initech", skill: "React", portal: "LinkedIn", incentiveType: "ANN", recruiter: "Riya Recruiter", joinDate: monthsAgo(15), bgvStatus: "cleared" },
    { joinerName: "Sahil Gupta", client: "Hooli", skill: "Data", portal: "Referral", incentiveType: "CTH", recruiter: "Arjun Recruiter", joinDate: monthsAgo(10), bgvStatus: "cleared" },
    { joinerName: "Mira Nair", client: "Acme", skill: "Java", portal: "Naukri", incentiveType: "FTE", recruiter: "Arjun Recruiter", joinDate: monthsAgo(7), bgvStatus: "cleared" },
    { joinerName: "Yash Verma", client: "Globex", skill: "Python", portal: "LinkedIn", incentiveType: "CTH", recruiter: "Arjun Recruiter", joinDate: monthsAgo(6), bgvStatus: "pending" },
    { joinerName: "Nikita Paul", client: "Initech", skill: "Node", portal: "Referral", incentiveType: "ANN", recruiter: "Arjun Recruiter", joinDate: monthsAgo(16), bgvStatus: "cleared" },
    { joinerName: "Aditya Kulkarni", client: "Hooli", skill: "QA", portal: "Naukri", incentiveType: "FTE", recruiter: "Arjun Recruiter", joinDate: monthsAgo(3), bgvStatus: "failed" },
    { joinerName: "Ritika Bose", client: "Acme", skill: "React", portal: "LinkedIn", incentiveType: "CTH", recruiter: "Arjun Recruiter", joinDate: monthsAgo(1), bgvStatus: "pending" },
    { joinerName: "Farhan Ali", client: "Globex", skill: "DevOps", portal: "Referral", incentiveType: "ANN", recruiter: "Arjun Recruiter", joinDate: monthsAgo(12), bgvStatus: "cleared" },
  ];

  const recruiterIds = recruiters.map((item) => item._id);
  await IncentiveClaim.deleteMany({ recruiterId: { $in: recruiterIds } });
  await Joiner.deleteMany({ recruiterId: { $in: recruiterIds } });
  await BGV.deleteMany({ updatedBy: bgvUser?._id });

  const createdJoiners = [];
  for (const row of joinerSeed) {
    const recruiterId = recruiterMap[row.recruiter];
    if (!recruiterId) continue;

    const joiner = await Joiner.create({
      recruiterId,
      joinerName: row.joinerName,
      client: row.client,
      skill: row.skill,
      portal: row.portal,
      joinDate: row.joinDate,
      incentiveType: row.incentiveType,
    });

    createdJoiners.push({ ...row, _id: joiner._id, recruiterId });

    await BGV.create({
      joinerId: joiner._id,
      bgvStatus: row.bgvStatus,
      updatedBy: bgvUser?._id,
    });
  }

  const claimSeed = [
    { joinerName: "Aarav Shah", status: "approved", note: "Approved by manager" },
    { joinerName: "Neha Iyer", status: "pending", note: "Awaiting review" },
    { joinerName: "Kabir Khan", status: "rejected", note: "BGV not cleared" },
    { joinerName: "Ananya Rao", status: "approved", note: "Approved by manager" },
    { joinerName: "Dev Mehta", status: "rejected", note: "Tenure not eligible" },
    { joinerName: "Ishita Sen", status: "rejected", note: "Recovery deficit active. Claim auto-rejected and deficit decremented." },
    { joinerName: "Sahil Gupta", status: "pending", note: "Awaiting review" },
    { joinerName: "Mira Nair", status: "approved", note: "Approved by manager" },
    { joinerName: "Nikita Paul", status: "rejected", note: "Recovery deficit active. Claim auto-rejected and deficit decremented." },
    { joinerName: "Ritika Bose", status: "not_eligible", note: "Joiner tenure not eligible yet" },
  ];

  for (const claimRow of claimSeed) {
    const joiner = createdJoiners.find((item) => item.joinerName === claimRow.joinerName);
    if (!joiner) continue;

    const recruiterUser = await User.findById(joiner.recruiterId).select("incentiveCTH incentiveANN").lean();
    const claimMonth = monthKey(new Date());

    await IncentiveClaim.create({
      joinerId: joiner._id,
      recruiterId: joiner.recruiterId,
      incentiveType: joiner.incentiveType,
      status: claimRow.status,
      claimMonth,
      monthPaid: claimMonth,
      incentiveAmount: joiner.incentiveType === "ANN" ? recruiterUser?.incentiveANN || 0 : recruiterUser?.incentiveCTH || 0,
      managerNote: claimRow.note,
    });
  }

  const recruiterWithDeficit = recruiters.find((item) => item.name === "Riya Recruiter");
  if (recruiterWithDeficit) {
    await Recovery.findOneAndUpdate(
      { recruiterId: recruiterWithDeficit._id, quarter: getCurrentQuarter() },
      { recruiterId: recruiterWithDeficit._id, quarter: getCurrentQuarter(), deficit: 3 },
      { upsert: true, new: true }
    );
  }

  const users = await User.find({ role: { $in: ["admin", "recruiter", "bgv", "manager"] } })
    .select("_id name email role empId")
    .sort({ role: 1 })
    .lean();

  const passwordMap = Object.fromEntries(seedUsers.map((user) => [user.email, user.password]));
  const output = users.map((user) => ({ ...user, password: passwordMap[user.email] }));

  console.log(JSON.stringify({
    users: output,
    createdJoiners: createdJoiners.length,
    claimsSeeded: claimSeed.length,
    recoverySeededForQuarter: getCurrentQuarter(),
  }, null, 2));

  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
