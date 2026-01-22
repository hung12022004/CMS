const express = require("express");
const router = express.Router();

const authController = require("../controllers/authcontroller");
const auth = require("../middlewares/auth");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// protected
router.get("/me", auth, authController.me);

module.exports = router;
