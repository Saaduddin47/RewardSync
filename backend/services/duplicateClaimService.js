const IncentiveClaim = require("../models/IncentiveClaim");

const hasDuplicateClaim = async ({ joinerId, incentiveType, claimDate = new Date() }) => {
  if (incentiveType === "ANN") {
    const year = new Date(claimDate).getFullYear().toString();
    const claim = await IncentiveClaim.findOne({
      joinerId,
      incentiveType: "ANN",
      claimMonth: new RegExp(`^${year}`),
    });
    return !!claim;
  }

  const claim = await IncentiveClaim.findOne({
    joinerId,
    incentiveType: { $in: ["CTH", "FTE"] },
  });
  return !!claim;
};

module.exports = {
  hasDuplicateClaim,
};
