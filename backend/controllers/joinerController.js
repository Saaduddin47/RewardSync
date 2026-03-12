const Joiner = require("../models/Joiner");
const BGV = require("../models/BGV");
const IncentiveClaim = require("../models/IncentiveClaim");
const { checkEligibility } = require("../services/eligibilityService");

const createJoiner = async (req, res) => {
  const joiner = await Joiner.create({
    ...req.body,
    recruiterId: req.user._id,
  });

  await BGV.create({
    joinerId: joiner._id,
    bgvStatus: "pending",
    updatedBy: req.user._id,
  });

  return res.status(201).json(joiner);
};

const getMyJoiners = async (req, res) => {
  const joiners = await Joiner.find({ recruiterId: req.user._id }).sort({ createdAt: -1 });

  const enriched = await Promise.all(
    joiners.map(async (joiner) => {
      const bgv = await BGV.findOne({ joinerId: joiner._id });
      const latestClaim = await IncentiveClaim.findOne({ joinerId: joiner._id, recruiterId: req.user._id }).sort({ createdAt: -1 });
      const eligibility = await checkEligibility({ joiner, recruiterId: req.user._id });

      return {
        ...joiner.toObject(),
        bgvStatus: bgv?.bgvStatus || "pending",
        claimStatus: latestClaim?.status || "not_claimed",
        eligibility,
      };
    })
  );

  return res.json(enriched);
};

const getBGVQueue = async (req, res) => {
  const bgvRecords = await BGV.find({ bgvStatus: "pending" })
    .populate({
      path: "joinerId",
      populate: { path: "recruiterId", select: "name empId" },
    })
    .sort({ updatedAt: 1 });

  const queue = bgvRecords
    .filter((record) => record.joinerId)
    .map((record) => ({
      id: record._id,
      joinerId: record.joinerId._id,
      joinerName: record.joinerId.joinerName,
      recruiter: record.joinerId.recruiterId?.name,
      client: record.joinerId.client,
      joinDate: record.joinerId.joinDate,
      bgvStatus: record.bgvStatus,
    }));

  return res.json(queue);
};

const getAllBGVJoiners = async (req, res) => {
  const bgvRecords = await BGV.find()
    .populate({
      path: "joinerId",
      populate: { path: "recruiterId", select: "name empId" },
    })
    .sort({ updatedAt: -1 });

  const rows = bgvRecords
    .filter((record) => record.joinerId)
    .map((record) => ({
      id: record._id,
      joinerId: record.joinerId._id,
      joinerName: record.joinerId.joinerName,
      recruiter: record.joinerId.recruiterId?.name,
      client: record.joinerId.client,
      joinDate: record.joinerId.joinDate,
      bgvStatus: record.bgvStatus,
    }));

  return res.json(rows);
};

const updateBGV = async (req, res) => {
  const { id } = req.params;
  const { bgvStatus } = req.body;

  const record = await BGV.findOneAndUpdate(
    { joinerId: id },
    { bgvStatus, updatedBy: req.user._id },
    { new: true }
  );

  if (!record) return res.status(404).json({ message: "BGV record not found" });
  return res.json(record);
};

const updateBGVByBody = async (req, res) => {
  const { joinerId, bgvStatus } = req.body || {};
  if (!joinerId || !bgvStatus) {
    return res.status(400).json({ message: "joinerId and bgvStatus are required" });
  }

  req.params.id = joinerId;
  req.body = { bgvStatus };
  return updateBGV(req, res);
};

module.exports = {
  createJoiner,
  getMyJoiners,
  getBGVQueue,
  getAllBGVJoiners,
  updateBGV,
  updateBGVByBody,
};
