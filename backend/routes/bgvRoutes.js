const express = require("express");
const { updateBGVByBody } = require("../controllers/joinerController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.put("/update", auth, role("bgv"), updateBGVByBody);

module.exports = router;
