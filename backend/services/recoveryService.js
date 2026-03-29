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
    const previousRecord = await Recovery.findOne({
      recruiterId,
      quarter: { $lt: quarter },
    }).sort({ quarter: -1 });

    const carriedDeficit = previousRecord && previousRecord.deficit > 0
      ? previousRecord.deficit
      : 0;

    record = await Recovery.create({ recruiterId, quarter, deficit: carriedDeficit });
  }
  return record;
};

const applyRecoveryRule = async (recruiterId) => {
  const baseRecord = await getOrCreateRecovery(recruiterId);

  const decrementedRecord = await Recovery.findOneAndUpdate(
    {
      _id: baseRecord._id,
      deficit: { $gt: 0 },
    },
    { $inc: { deficit: -1 } },
    { new: true }
  );

  if (decrementedRecord) {
    return {
      approved: false,
      reason: "Recovery deficit active. Claim auto-rejected and deficit decremented.",
      deficit: decrementedRecord.deficit,
    };
  }

  return {
    approved: true,
    reason: "No recovery deficit",
    deficit: baseRecord.deficit,
  };
};

module.exports = {
  getCurrentQuarter,
  getOrCreateRecovery,
  applyRecoveryRule,
};
