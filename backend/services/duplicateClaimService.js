const IncentiveClaim = require("../models/IncentiveClaim");

const hasDuplicateClaim = async ({ recruiterId, joinerId, incentiveType }) => {
  if (incentiveType === "ANN") {
    const year = new Date().getFullYear().toString();
    const claim = await IncentiveClaim.findOne({
      recruiterId,
      joinerId,
      incentiveType: "ANN",
      monthPaid: new RegExp(`^${year}`),
    });
    return !!claim;
  }

  const claim = await IncentiveClaim.findOne({
    recruiterId,
    joinerId,
    incentiveType: { $in: ["CTH", "FTE"] },
  });
  return !!claim;
};

module.exports = {
  hasDuplicateClaim,
};
