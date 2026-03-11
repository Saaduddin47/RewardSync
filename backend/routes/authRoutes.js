const express = require("express");
const { login, me, seedAdminInfo, seedAdmin, seedAllRoles } = require("../controllers/authController");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/login", login);
router.get("/me", auth, me);
router.get("/seed-admin", seedAdminInfo);
router.post("/seed-admin", seedAdmin);
router.post("/seed-all-roles", seedAllRoles);

module.exports = router;
