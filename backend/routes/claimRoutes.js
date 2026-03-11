const express = require("express");
const { createClaim, getClaims, decideClaim } = require("../controllers/claimController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.post("/:joinerId", auth, role("recruiter"), createClaim);
router.get("/", auth, role("recruiter", "manager", "admin"), getClaims);
router.patch("/:id/decision", auth, role("manager"), decideClaim);

module.exports = router;
