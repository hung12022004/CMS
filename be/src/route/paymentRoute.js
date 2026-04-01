const express = require("express");
const paymentController = require("../controllers/paymentController");
const auth = require("../middlewares/auth");

const router = express.Router();

// API Xử lý xác nhận thanh toán/đặt lịch và sinh hóa đơn (không dùng QR)
router.post("/confirm-manual", auth, paymentController.confirmManualPayment);

module.exports = router;
