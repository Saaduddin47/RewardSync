const User = require("../models/User");
const Recovery = require("../models/Recovery");

const createEmployee = async (req, res) => {
  const {
    name,
    email,
    role,
    empId,
    doj,
    quarterlyTarget,
    incentiveCTH,
    incentiveANN,
    password,
  } = req.body;

  const employee = await User.create({
    name,
    email,
    role,
    empId,
    doj,
    quarterlyTarget,
    incentiveCTH,
    incentiveANN,
    password: password || "Pass@123",
  });

  return res.status(201).json({
    id: employee._id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
  });
};

const getEmployees = async (req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return res.json(users);
};

const getRecovery = async (req, res) => {
  const rows = await Recovery.find()
    .populate("recruiterId", "name empId")
    .sort({ updatedAt: -1 });
  return res.json(rows);
};

const upsertRecovery = async (req, res) => {
  const { recruiterId, quarter, deficit } = req.body;
  const row = await Recovery.findOneAndUpdate(
    { recruiterId, quarter },
    { recruiterId, quarter, deficit },
    { upsert: true, new: true }
  );
  return res.json(row);
};

module.exports = {
  createEmployee,
  getEmployees,
  getRecovery,
  upsertRecovery,
};
