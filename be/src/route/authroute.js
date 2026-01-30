const express = require("express");
const router = express.Router();

const authController = require("../controllers/authcontroller");
const auth = require("../middlewares/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/verify-register-otp", authController.verifyRegisterOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// protected
router.get("/me", auth, authController.me);

module.exports = router;
