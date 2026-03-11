const jwt = require("jsonwebtoken");
const User = require("../models/User");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const valid = await user.comparePassword(password);
  if (!valid) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken(user._id);
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      empId: user.empId,
    },
  });
};

const me = async (req, res) => res.json(req.user);

const seedAdminInfo = async (req, res) => {
  return res.status(200).json({
    message: "Use POST /api/auth/seed-admin to create the first admin user.",
    method: "POST",
    endpoint: "/api/auth/seed-admin",
  });
};

const seedAdmin = async (req, res) => {
  const existing = await User.findOne({ role: "admin" });
  if (existing) {
    return res.status(200).json({
      message: "Admin already exists",
      alreadyExists: true,
      admin: {
        id: existing._id,
        email: existing.email,
        role: existing.role,
      },
    });
  }

  const admin = await User.create({
    name: "System Admin",
    email: "admin@rewardsync.com",
    password: "Admin@123",
    role: "admin",
    empId: "ADM001",
    doj: new Date(),
    quarterlyTarget: 0,
    incentiveCTH: 0,
    incentiveANN: 0,
  });

  return res.status(201).json({
    message: "Admin seeded",
    alreadyExists: false,
    admin: {
      id: admin._id,
      email: admin.email,
      role: admin.role,
    },
    credentials: {
      email: admin.email,
      password: "Admin@123",
    },
  });
};

const seedAllRoles = async (req, res) => {
  const seedUsers = [
    {
      name: "System Admin",
      email: "admin@rewardsync.com",
      password: "Admin@123",
      role: "admin",
      empId: "ADM001",
      quarterlyTarget: 0,
      incentiveCTH: 0,
      incentiveANN: 0,
    },
    {
      name: "Riya Recruiter",
      email: "recruiter@rewardsync.com",
      password: "Recruiter@123",
      role: "recruiter",
      empId: "REC001",
      quarterlyTarget: 10,
      incentiveCTH: 10000,
      incentiveANN: 30000,
    },
    {
      name: "Ben BGV",
      email: "bgv@rewardsync.com",
      password: "Bgv@123",
      role: "bgv",
      empId: "BGV001",
      quarterlyTarget: 0,
      incentiveCTH: 0,
      incentiveANN: 0,
    },
    {
      name: "Maya Manager",
      email: "manager@rewardsync.com",
      password: "Manager@123",
      role: "manager",
      empId: "MGR001",
      quarterlyTarget: 0,
      incentiveCTH: 0,
      incentiveANN: 0,
    },
  ];

  const created = [];
  const existing = [];

  for (const userData of seedUsers) {
    const found = await User.findOne({ email: userData.email });
    if (found) {
      existing.push({ role: found.role, email: found.email });
      continue;
    }

    const user = await User.create({
      ...userData,
      doj: new Date(),
    });
    created.push({ role: user.role, email: user.email, password: userData.password });
  }

  return res.status(201).json({
    message: "Role seed completed",
    created,
    existing,
  });
};

module.exports = {
  login,
  me,
  seedAdminInfo,
  seedAdmin,
  seedAllRoles,
};
