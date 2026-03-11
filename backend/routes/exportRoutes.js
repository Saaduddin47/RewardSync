const express = require("express");
const { exportReport } = require("../controllers/exportController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.get("/", auth, role("manager", "admin"), exportReport);

module.exports = router;
