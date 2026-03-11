const Recovery = require("../models/Recovery");

const getCurrentQuarter = () => {
  const date = new Date();
  const q = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${q}`;
};

const getOrCreateRecovery = async (recruiterId) => {
  const quarter = getCurrentQuarter();
  let record = await Recovery.findOne({ recruiterId, quarter });
  if (!record) {
    record = await Recovery.create({ recruiterId, quarter, deficit: 0 });
  }
  return record;
};

const applyRecoveryRule = async (recruiterId) => {
  const record = await getOrCreateRecovery(recruiterId);
  if (record.deficit > 0) {
    record.deficit -= 1;
    await record.save();
    return {
      approved: false,
      reason: "Recovery deficit active. Claim auto-rejected and deficit decremented.",
      deficit: record.deficit,
    };
  }

  return {
    approved: true,
    reason: "No recovery deficit",
    deficit: record.deficit,
  };
};

module.exports = {
  getCurrentQuarter,
  getOrCreateRecovery,
  applyRecoveryRule,
};
