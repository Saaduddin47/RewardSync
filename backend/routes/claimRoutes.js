const express = require("express");
const {
	createClaim,
	createClaimByBody,
	getClaims,
	decideClaim,
	decideClaimByBody,
} = require("../controllers/claimController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.post("/:joinerId", auth, role("recruiter"), createClaim);
router.post("/", auth, role("recruiter"), createClaimByBody);
router.get("/", auth, role("recruiter", "manager", "admin"), getClaims);
router.patch("/:id/decision", auth, role("manager"), decideClaim);
router.put("/approve", auth, role("manager"), decideClaimByBody);

module.exports = router;
