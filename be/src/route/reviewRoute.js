const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const reviewController = require("../controllers/reviewController");

// Bệnh nhân mới có quyền đánh giá
router.post("/", auth, authorize("patient"), reviewController.createReview);

// Ai cũng có thể xem đánh giá của bác sĩ
router.get("/doctor/:doctorId", reviewController.getDoctorReviews);

module.exports = router;
