const Joiner = require("../models/Joiner");
const User = require("../models/User");
const BGV = require("../models/BGV");
const IncentiveClaim = require("../models/IncentiveClaim");
const { checkDuplicateClaimRule } = require("../services/duplicateClaimService");
const { checkEligibility, getTenureMonths } = require("../services/eligibilityService");
const { applyRecoveryRule, getOrCreateRecovery } = require("../services/recoveryService");

const toClaimResponse = (claimDoc) => {
  const claim = claimDoc?.toObject ? claimDoc.toObject() : claimDoc;
  const { managerNote, ...rest } = claim || {};
  return {
    ...rest,
    comment: managerNote || "—",
  };
};

const createClaim = async (req, res) => {
  const { joinerId } = req.params;

  const joiner = await Joiner.findById(joinerId);
  if (!joiner) return res.status(404).json({ message: "Joiner not found" });
  if (joiner.recruiterId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not allowed" });
  }

  const duplicateCheck = await checkDuplicateClaimRule({
    joinerBusinessId: joiner.joinerId,
    incentiveType: joiner.incentiveType,
  });
  if (duplicateCheck.blocked) {
    return res.status(400).json({ message: duplicateCheck.reason });
  }

  const eligibility = await checkEligibility({ joiner });

  const user = await User.findById(req.user._id);
  const amount = joiner.incentiveType === "ANN" ? user.incentiveANN : user.incentiveCTH;

  const now = new Date();
  const claimMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const claim = await IncentiveClaim.create({
    joinerId,
    recruiterId: req.user._id,
    incentiveType: joiner.incentiveType,
    status: eligibility.tenureEligible ? "pending" : "not_eligible",
    claimMonth,
    monthPaid: claimMonth,
    incentiveAmount: amount,
    managerNote: eligibility.tenureEligible ? undefined : "Joiner tenure not eligible yet",
  });

  return res.status(201).json({
    ...toClaimResponse(claim),
    eligibility,
  });
};

const createClaimByBody = async (req, res) => {
  req.params.joinerId = req.body?.joinerId;
  if (!req.params.joinerId) {
    return res.status(400).json({ message: "joinerId is required" });
  }
  return createClaim(req, res);
};

const getClaims = async (req, res) => {
  const query = req.user.role === "recruiter" ? { recruiterId: req.user._id } : {};
  const claims = await IncentiveClaim.find(query)
    .populate({ path: "recruiterId", select: "name empId" })
    .populate({ path: "joinerId", select: "joinerId joinerName client joinDate incentiveType skill portal" })
    .sort({ createdAt: -1 });

  const enriched = await Promise.all(
    claims.map(async (claim) => {
      const bgv = await BGV.findOne({ joinerId: claim.joinerId?._id });
      const tenure = claim.joinerId?.joinDate ? getTenureMonths(claim.joinerId.joinDate) : 0;
      const recovery = await getOrCreateRecovery(claim.recruiterId?._id);

      return {
        ...toClaimResponse(claim),
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
    return res.json(toClaimResponse(claim));
  }

  const eligibility = await checkEligibility({ joiner: claim.joinerId });
  if (!eligibility.tenureEligible) {
    claim.status = "rejected";
    claim.managerNote = "Joiner tenure not eligible yet";
    await claim.save();
    return res.json(toClaimResponse(claim));
  }

  const recoveryResult = await applyRecoveryRule(claim.recruiterId._id);
  claim.status = "approved";
  claim.managerNote = recoveryResult.approved
    ? "Approved"
    : "Approved — incentive withheld due to recovery deficit";
  await claim.save();
  return res.json(toClaimResponse(claim));
};

const decideClaimByBody = async (req, res) => {
  req.params.id = req.body?.claimId;
  if (!req.params.id) {
    return res.status(400).json({ message: "claimId is required" });
  }
  return decideClaim(req, res);
};

module.exports = {
  createClaim,
  createClaimByBody,
  getClaims,
  decideClaim,
  decideClaimByBody,
};
