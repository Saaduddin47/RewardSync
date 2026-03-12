const express = require("express");
const {
	createEmployee,
	getEmployees,
	updateEmployee,
	toggleEmployeeActive,
	getRecovery,
	upsertRecovery,
} = require("../controllers/adminController");
const auth = require("../middleware/auth");
const role = require("../middleware/role");

const router = express.Router();

router.post("/employees", auth, role("admin"), createEmployee);
router.get("/employees", auth, role("admin"), getEmployees);
router.patch("/employees/:id", auth, role("admin"), updateEmployee);
router.patch("/employees/:id/toggle-active", auth, role("admin"), toggleEmployeeActive);
router.get("/recovery", auth, role("admin"), getRecovery);
router.patch("/recovery", auth, role("admin"), upsertRecovery);

module.exports = router;
