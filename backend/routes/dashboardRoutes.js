const express = require("express");
const { recruiterStats, managerStats } = require("../controllers/dashboardController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.get("/recruiter", auth, role("recruiter"), recruiterStats);
router.get("/manager", auth, role("manager", "admin"), managerStats);

module.exports = router;
