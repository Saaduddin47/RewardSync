const Joiner = require("../models/Joiner");
const Recovery = require("../models/Recovery");
const IncentiveClaim = require("../models/IncentiveClaim");
const User = require("../models/User");
const { getCurrentQuarter } = require("../services/recoveryService");

const recruiterStats = async (req, res) => {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
  const quarterEnd = new Date(now.getFullYear(), quarterStartMonth + 3, 1, 0, 0, 0, 0);

  const joinersCount = await Joiner.countDocuments({
    recruiterId: req.user._id,
    createdAt: { $gte: quarterStart, $lt: quarterEnd },
  });

  const approvedClaimsCount = await IncentiveClaim.countDocuments({
    recruiterId: req.user._id,
    status: "approved",
  });

  const quarterlyTarget = req.user.quarterlyTarget || 0;
  const currentDeficit = quarterlyTarget - approvedClaimsCount;

  return res.json({
    quarterlyTarget,
    joinersSubmitted: joinersCount,
    currentDeficit,
  });
};

const managerStats = async (req, res) => {
  const pending = await IncentiveClaim.countDocuments({ status: "pending" });
  const approved = await IncentiveClaim.countDocuments({ status: "approved" });
  const rejected = await IncentiveClaim.countDocuments({ status: "rejected" });

  return res.json({ pending, approved, rejected });
};

const recruiterDeficits = async (req, res) => {
  const quarter = getCurrentQuarter();

  const [recruiters, recoveryRows] = await Promise.all([
    User.find({ role: "recruiter" })
      .select("name email empId")
      .sort({ name: 1 })
      .lean(),
    Recovery.find({ quarter }).select("recruiterId deficit").lean(),
  ]);

  const deficitMap = new Map(
    recoveryRows.map((row) => [String(row.recruiterId), Number(row.deficit || 0)])
  );

  const rows = recruiters.map((recruiter) => ({
    recruiterId: recruiter._id,
    name: recruiter.name,
    email: recruiter.email,
    empId: recruiter.empId,
    deficit: deficitMap.get(String(recruiter._id)) || 0,
    quarter,
  }));

  return res.json(rows);
};

module.exports = {
  recruiterStats,
  managerStats,
  recruiterDeficits,
};
