const Joiner = require("../models/Joiner");
const User = require("../models/User");
const BGV = require("../models/BGV");
const IncentiveClaim = require("../models/IncentiveClaim");
const { hasDuplicateClaim } = require("../services/duplicateClaimService");
const { checkEligibility, getTenureMonths } = require("../services/eligibilityService");
const { applyRecoveryRule, getOrCreateRecovery } = require("../services/recoveryService");

const createClaim = async (req, res) => {
  const { joinerId } = req.params;

  const joiner = await Joiner.findById(joinerId);
  if (!joiner) return res.status(404).json({ message: "Joiner not found" });
  if (joiner.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const duplicate = await hasDuplicateClaim({
    recruiterId: req.user._id,
    joinerId,
    incentiveType: joiner.incentiveType,
  });
  if (duplicate) {
    return res.status(400).json({ message: "Duplicate incentive claim is not allowed" });
  }

  const eligibility = await checkEligibility({ joiner, recruiterId: req.user._id });
  if (!eligibility.tenureEligible) {
    return res.status(400).json({ message: "Joiner tenure not eligible yet" });
  }

  const user = await User.findById(req.user._id);
  const amount = joiner.incentiveType === "ANN" ? user.incentiveANN : user.incentiveCTH;

  const now = new Date();
  const monthPaid = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const claim = await IncentiveClaim.create({
    joinerId,
    recruiterId: req.user._id,
    incentiveType: joiner.incentiveType,
    status: "pending",
    monthPaid,
    incentiveAmount: amount,
  });

  return res.status(201).json(claim);
};

const getClaims = async (req, res) => {
  const query = req.user.role === "recruiter" ? { recruiterId: req.user._id } : {};
  const claims = await IncentiveClaim.find(query)
    .populate({ path: "recruiterId", select: "name empId" })
    .populate({ path: "joinerId", select: "joinerName client joinDate incentiveType skill portal" })
    .sort({ createdAt: -1 });

  const enriched = await Promise.all(
    claims.map(async (claim) => {
      const bgv = await BGV.findOne({ joinerId: claim.joinerId?._id });
      const tenure = claim.joinerId?.joinDate ? getTenureMonths(claim.joinerId.joinDate) : 0;
      const recovery = await getOrCreateRecovery(claim.recruiterId?._id);

      return {
        ...claim.toObject(),
        bgvStatus: bgv?.bgvStatus || "pending",
        tenure,
        recoveryDeficit: recovery?.deficit || 0,
      };
    })
  );

  return res.json(enriched);
};

const decideClaim = async (req, res) => {
  const { id } = req.params;
  const { action, managerNote } = req.body;

  const claim = await IncentiveClaim.findById(id).populate("joinerId recruiterId");
  if (!claim) return res.status(404).json({ message: "Claim not found" });

  if (claim.status !== "pending") {
    return res.status(400).json({ message: "Claim already processed" });
  }

  if (action === "reject") {
    claim.status = "rejected";
    claim.managerNote = managerNote || "Rejected by manager";
    await claim.save();
    return res.json(claim);
  }

  const bgv = await BGV.findOne({ joinerId: claim.joinerId._id });
  if (!bgv || bgv.bgvStatus !== "cleared") {
    claim.status = "rejected";
    claim.managerNote = "BGV not cleared";
    await claim.save();
    return res.json(claim);
  }

  const eligibility = await checkEligibility({ joiner: claim.joinerId, recruiterId: claim.recruiterId._id });
  if (!eligibility.tenureEligible) {
    claim.status = "rejected";
    claim.managerNote = "Tenure not eligible";
    await claim.save();
    return res.json(claim);
  }

  const recoveryResult = await applyRecoveryRule(claim.recruiterId._id);
  if (!recoveryResult.approved) {
    claim.status = "rejected";
    claim.managerNote = recoveryResult.reason;
    await claim.save();
    return res.json(claim);
  }

  claim.status = "approved";
  claim.managerNote = managerNote || "Approved by manager";
  await claim.save();
  return res.json(claim);
};

module.exports = {
  createClaim,
  getClaims,
  decideClaim,
};
