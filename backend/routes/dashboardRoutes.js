const express = require("express");
const { recruiterStats, managerStats, recruiterDeficits } = require("../controllers/dashboardController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.get("/recruiter", auth, role("recruiter"), recruiterStats);
router.get("/manager", auth, role("manager", "admin"), managerStats);
router.get("/deficits", auth, role("manager", "admin"), recruiterDeficits);

module.exports = router;
