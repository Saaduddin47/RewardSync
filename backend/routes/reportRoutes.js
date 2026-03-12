const express = require("express");
const { exportReport, exportIncentiveTracker } = require("../controllers/exportController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.get("/", auth, role("manager", "admin"), exportReport);
router.get("/incentive-tracker", auth, role("manager", "admin"), exportIncentiveTracker);

module.exports = router;
