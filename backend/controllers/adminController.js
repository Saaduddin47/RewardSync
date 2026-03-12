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

const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const allowedFields = [
    "name",
    "email",
    "role",
    "empId",
    "doj",
    "quarterlyTarget",
    "incentiveCTH",
    "incentiveANN",
    "isActive",
  ];

  const payload = Object.fromEntries(
    Object.entries(req.body || {}).filter(([key]) => allowedFields.includes(key))
  );

  if (Object.prototype.hasOwnProperty.call(payload, "password")) {
    delete payload.password;
  }

  const employee = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  return res.json(employee);
};

const toggleEmployeeActive = async (req, res) => {
  const { id } = req.params;
  const employee = await User.findById(id);
  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  employee.isActive = !employee.isActive;
  await employee.save();

  return res.json({
    id: employee._id,
    isActive: employee.isActive,
  });
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
  updateEmployee,
  toggleEmployeeActive,
  getRecovery,
  upsertRecovery,
};
