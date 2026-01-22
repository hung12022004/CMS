const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth");
const userController = require("../controllers/userController");

router.get("/me", auth, userController.getMe);
router.patch("/me", auth, userController.updateMe);
router.patch("/me/password", auth, userController.changePassword);

module.exports = router;
