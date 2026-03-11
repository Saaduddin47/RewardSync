const Joiner = require("../models/Joiner");
const Recovery = require("../models/Recovery");
const IncentiveClaim = require("../models/IncentiveClaim");
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

module.exports = {
  recruiterStats,
  managerStats,
};
