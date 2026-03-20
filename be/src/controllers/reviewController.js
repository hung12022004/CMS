const Review = require("../models/Review");
const Appointment = require("../models/Appointment");

// POST /api/v1/reviews
// Body: { doctorId, appointmentId, rating, comment }
exports.createReview = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { doctorId, appointmentId, rating, comment } = req.body;

    if (!doctorId || !appointmentId || !rating) {
      return res.status(400).json({ message: "Thiếu thông tin đánh giá" });
    }

    // Kiểm tra xem lịch hẹn có tồn tại và thuộc về bệnh nhân này không
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patientId,
      status: "completed",
    });

    if (!appointment) {
      return res.status(400).json({
        message: "Lịch hẹn không hợp lệ hoặc chưa hoàn thành",
      });
    }

    // Kiểm tra xem đã đánh giá chưa
    const existingReview = await Review.findOne({ appointmentId });
    if (existingReview) {
      return res.status(400).json({ message: "Bạn đã đánh giá lịch hẹn này rồi" });
    }

    const review = await Review.create({
      patientId,
      doctorId,
      appointmentId,
      rating,
      comment,
    });

    return res.status(201).json({
      message: "Đánh giá thành công",
      review,
    });
  } catch (err) {
    console.error("createReview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /api/v1/reviews/doctor/:doctorId
exports.getDoctorReviews = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const reviews = await Review.find({ doctorId })
      .populate("patientId", "name avatarUrl")
      .sort({ createdAt: -1 });

    return res.status(200).json({ reviews });
  } catch (err) {
    console.error("getDoctorReviews error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
