const IncentiveClaim = require("../models/IncentiveClaim");
const Joiner = require("../models/Joiner");

const CTH_FTH_TYPES = ["CTH", "FTH", "FTE"];
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getJoinerObjectIdsByBusinessId = async (joinerBusinessId) => {
  const joiners = await Joiner.find({ joinerId: joinerBusinessId }).select("_id").lean();
  return joiners.map((row) => row._id);
};

const checkDuplicateClaimRule = async ({ joinerBusinessId, incentiveType, now = new Date() }) => {
  const joinerObjectIds = await getJoinerObjectIdsByBusinessId(joinerBusinessId);
  if (!joinerObjectIds.length) {
    return { blocked: false };
  }

  if (CTH_FTH_TYPES.includes(incentiveType)) {
    const existingCthFth = await IncentiveClaim.findOne({
      joinerId: { $in: joinerObjectIds },
      incentiveType: { $in: CTH_FTH_TYPES },
    })
      .select("_id")
      .lean();

    if (existingCthFth) {
      return {
        blocked: true,
        reason: "CTH/FTH already claimed for this Joiner",
      };
    }

    return { blocked: false };
  }

  if (incentiveType === "ANN") {
    const latestAnnClaim = await IncentiveClaim.findOne({
      joinerId: { $in: joinerObjectIds },
      incentiveType: "ANN",
    })
      .sort({ createdAt: -1 })
      .select("createdAt")
      .lean();

    if (!latestAnnClaim?.createdAt) {
      return { blocked: false };
    }

    const diffDays = (new Date(now).getTime() - new Date(latestAnnClaim.createdAt).getTime()) / ONE_DAY_MS;
    if (diffDays < 365) {
      return {
        blocked: true,
        reason: "ANN already claimed within the last 12 months",
      };
    }

    return { blocked: false };
  }

  return { blocked: false };
};

module.exports = {
  checkDuplicateClaimRule,
};
