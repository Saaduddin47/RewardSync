const IncentiveClaim = require("../models/IncentiveClaim");

const MONTHS_FOR_STANDARD_ELIGIBILITY = 3;
const MONTHS_FOR_ANNUAL_ELIGIBILITY = 12;

const toValidDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getTenureMonths = (joinDate) => {
  const start = toValidDate(joinDate);
  if (!start) return 0;

  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());

  if (now.getDate() < start.getDate()) {
    months -= 1;
  }

  return Math.max(months, 0);
};

const checkEligibility = async ({ joiner, claimDate = new Date() }) => {
  const tenureMonths = getTenureMonths(joiner.joinDate);
  const isAnnual = joiner.incentiveType === "ANN";
  const tenureEligible = isAnnual
    ? tenureMonths >= MONTHS_FOR_ANNUAL_ELIGIBILITY
    : tenureMonths >= MONTHS_FOR_STANDARD_ELIGIBILITY;

  let duplicate = false;
  if (isAnnual) {
    const currentYear = new Date(claimDate).getFullYear().toString();
    duplicate = !!(await IncentiveClaim.findOne({
      joinerId: joiner._id,
      incentiveType: "ANN",
      claimMonth: new RegExp(`^${currentYear}`),
    }));
  } else {
    duplicate = !!(await IncentiveClaim.findOne({
      joinerId: joiner._id,
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
