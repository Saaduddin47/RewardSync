const Joiner = require("../models/Joiner");
const Recovery = require("../models/Recovery");
const IncentiveClaim = require("../models/IncentiveClaim");
const User = require("../models/User");
const { getCurrentQuarter } = require("../services/recoveryService");

const recruiterStats = async (req, res) => {
  const quarter = getCurrentQuarter();
  const joinersCount = await Joiner.countDocuments({ recruiterId: req.user._id });
  const recovery = await Recovery.findOne({ recruiterId: req.user._id, quarter });

  return res.json({
    quarterlyTarget: req.user.quarterlyTarget || 0,
    joinersSubmitted: joinersCount,
    currentDeficit: recovery?.deficit || 0,
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
