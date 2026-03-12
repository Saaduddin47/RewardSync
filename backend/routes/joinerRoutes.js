const express = require("express");
const { createJoiner, getMyJoiners, getBGVQueue, getAllBGVJoiners, updateBGV } = require("../controllers/joinerController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.post("/", auth, role("recruiter"), createJoiner);
router.get("/my", auth, role("recruiter"), getMyJoiners);
router.get("/bgv-queue", auth, role("bgv"), getBGVQueue);
router.get("/bgv-all", auth, role("bgv"), getAllBGVJoiners);
router.patch("/:id/bgv", auth, role("bgv"), updateBGV);

module.exports = router;
