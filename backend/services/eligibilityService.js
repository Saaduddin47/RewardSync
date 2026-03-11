const IncentiveClaim = require("../models/IncentiveClaim");

const getTenureMonths = (joinDate) => {
  const start = new Date(joinDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.max(months, 0);
};

const checkEligibility = async ({ joiner, recruiterId }) => {
  const tenureMonths = getTenureMonths(joiner.joinDate);
  const isAnnual = joiner.incentiveType === "ANN";
  const tenureEligible = isAnnual ? tenureMonths >= 12 : tenureMonths >= 3;

  let duplicate = false;
  if (isAnnual) {
    const currentYear = new Date().getFullYear().toString();
    duplicate = !!(await IncentiveClaim.findOne({
      joinerId: joiner._id,
      recruiterId,
      incentiveType: "ANN",
      monthPaid: new RegExp(`^${currentYear}`),
    }));
  } else {
    duplicate = !!(await IncentiveClaim.findOne({
      joinerId: joiner._id,
      recruiterId,
      incentiveType: { $in: ["CTH", "FTE"] },
    }));
  }

  return {
    tenureMonths,
    tenureEligible,
    duplicate,
    eligible: tenureEligible && !duplicate,
  };
};

module.exports = {
  getTenureMonths,
  checkEligibility,
};
