require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Joiner = require("../models/Joiner");
const BGV = require("../models/BGV");
const IncentiveClaim = require("../models/IncentiveClaim");
const Recovery = require("../models/Recovery");
const { checkDuplicateClaimRule } = require("../services/duplicateClaimService");
const { getCurrentQuarter } = require("../services/recoveryService");

const monthsAgo = (count) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMonth(date.getMonth() - count);
  return date;
};

const getClaimMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const buildUsers = () => [
  {
    name: "Riya Recruiter",
    role: "recruiter",
    email: "recruiter1@rewardsync.com",
    empId: "REC101",
    password: "Recruiter1@123",
    quarterlyTarget: 12,
    incentiveCTH: 10000,
    incentiveANN: 30000,
  },
  {
    name: "Arjun Recruiter",
    role: "recruiter",
    email: "recruiter2@rewardsync.com",
    empId: "REC102",
    password: "Recruiter2@123",
    quarterlyTarget: 10,
    incentiveCTH: 9000,
    incentiveANN: 28000,
  },
  {
    name: "Nina Recruiter",
    role: "recruiter",
    email: "recruiter3@rewardsync.com",
    empId: "REC103",
    password: "Recruiter3@123",
    quarterlyTarget: 11,
    incentiveCTH: 9500,
    incentiveANN: 29000,
  },
  {
    name: "Maya Manager",
    role: "manager",
    email: "manager1@rewardsync.com",
    empId: "MGR101",
    password: "Manager1@123",
    quarterlyTarget: 0,
    incentiveCTH: 0,
    incentiveANN: 0,
  },
  {
    name: "Ben BGV",
    role: "bgv",
    email: "bgv1@rewardsync.com",
    empId: "BGV101",
    password: "Bgv1@123",
    quarterlyTarget: 0,
    incentiveCTH: 0,
    incentiveANN: 0,
  },
];

const joinerTemplates = [
  {
    suffix: "A",
    joinerName: "Aanya Sharma",
    incentiveType: "CTH",
    joinDate: monthsAgo(2),
    bgvStatus: "pending",
    claimStatus: "not_eligible",
    managerNote: "Joiner tenure not eligible yet",
  },
  {
    suffix: "B",
    joinerName: "Kabir Singh",
    incentiveType: "CTH",
    joinDate: monthsAgo(5),
    bgvStatus: "pending",
    claimStatus: "pending",
  },
  {
    suffix: "C",
    joinerName: "Meera Nair",
    incentiveType: "FTE",
    joinDate: monthsAgo(8),
    bgvStatus: "cleared",
    claimStatus: "approved",
    managerNote: "Approved by manager",
  },
  {
    suffix: "D",
    joinerName: "Rohan Das",
    incentiveType: "CTH",
    joinDate: monthsAgo(7),
    bgvStatus: "failed",
    claimStatus: "rejected",
    managerNote: "Rejected by manager due to profile mismatch",
  },
  {
    suffix: "E",
    joinerName: "Ishita Sen",
    incentiveType: "ANN",
    joinDate: monthsAgo(14),
    bgvStatus: "cleared",
    claimStatus: "pending",
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.mongoURI);

  await Promise.all([
    IncentiveClaim.deleteMany({}),
    BGV.deleteMany({}),
    Joiner.deleteMany({}),
    Recovery.deleteMany({}),
    User.deleteMany({ role: { $ne: "admin" } }),
  ]);

  const usersToCreate = buildUsers();
  const createdUsers = [];

  for (const user of usersToCreate) {
    const created = await User.create({
      name: user.name,
      role: user.role,
      email: user.email,
      empId: user.empId,
      password: user.password,
      doj: monthsAgo(24),
      quarterlyTarget: user.quarterlyTarget,
      incentiveCTH: user.incentiveCTH,
      incentiveANN: user.incentiveANN,
    });
    createdUsers.push(created);
  }

  const recruiters = createdUsers.filter((user) => user.role === "recruiter");
  const bgvUser = createdUsers.find((user) => user.role === "bgv");

  const claimMonth = getClaimMonth();

  for (let idx = 0; idx < recruiters.length; idx += 1) {
    const recruiter = recruiters[idx];

    for (const template of joinerTemplates) {
      const joiner = await Joiner.create({
        recruiterId: recruiter._id,
        joinerId: `RJ${idx + 1}${template.suffix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        joinerName: `${template.joinerName} ${idx + 1}`,
        client: idx % 2 === 0 ? "Acme" : "Globex",
        skill: idx % 2 === 0 ? "Java" : "React",
        portal: idx % 2 === 0 ? "Naukri" : "LinkedIn",
        joinDate: template.joinDate,
        incentiveType: template.incentiveType,
      });

      await BGV.create({
        joinerId: joiner._id,
        bgvStatus: template.bgvStatus,
        updatedBy: bgvUser ? bgvUser._id : recruiter._id,
      });

      const incentiveAmount =
        template.incentiveType === "ANN" ? recruiter.incentiveANN : recruiter.incentiveCTH;

      const claimPayload = {
        joinerId: joiner._id,
        recruiterId: recruiter._id,
        incentiveType: template.incentiveType,
        status: template.claimStatus,
        claimMonth,
        monthPaid: claimMonth,
        incentiveAmount,
      };

      if (template.managerNote) {
        claimPayload.managerNote = template.managerNote;
      }

      if (template.claimStatus === "rejected" && !claimPayload.managerNote) {
        claimPayload.managerNote = "Rejected by manager";
      }

      if (template.claimStatus === "not_eligible" && !claimPayload.managerNote) {
        claimPayload.managerNote = "Joiner tenure not eligible yet";
      }

      if (template.claimStatus === "approved" && !claimPayload.managerNote) {
        claimPayload.managerNote = "Approved by manager";
      }

      await IncentiveClaim.create(claimPayload);

      if (template.suffix === "C") {
        const duplicateCheck = await checkDuplicateClaimRule({
          joinerBusinessId: joiner.joinerId,
          incentiveType: "CTH",
        });
        if (!duplicateCheck.blocked) {
          throw new Error("Duplicate rule verification failed for CTH/FTH");
        }
      }
    }
  }

  const quarter = getCurrentQuarter();
  for (const recruiter of recruiters) {
    await Recovery.findOneAndUpdate(
      { recruiterId: recruiter._id, quarter },
      { recruiterId: recruiter._id, quarter, deficit: 2 },
      { upsert: true, new: true }
    );
  }

  // Ensure at least one ANN approved claim exists for coverage
  const annApprovedJoiner = await Joiner.findOne({
    recruiterId: recruiters[0]._id,
    incentiveType: "ANN",
  });
  if (annApprovedJoiner) {
    await IncentiveClaim.findOneAndUpdate(
      { joinerId: annApprovedJoiner._id, recruiterId: recruiters[0]._id, incentiveType: "ANN" },
      {
        status: "approved",
        managerNote: "Approved by manager",
      },
      { new: true }
    );
  }

  console.log("Fresh data seeded successfully.");
  await mongoose.disconnect();
};

seed().catch(async (error) => {
  console.error(error.message || error);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
