const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const adminController = require("../controllers/adminController");

// Tất cả route admin đều cần auth + authorize("admin")
router.use(auth, authorize("admin"));

router.get("/users", adminController.getAllUsers);
router.post("/users/create-staff", adminController.createStaffAccount);
router.patch("/users/:id/role", adminController.updateUserRole);
router.patch("/users/:id/ban", adminController.toggleBanUser);

module.exports = router;
