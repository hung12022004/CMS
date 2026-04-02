require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
// ... (giữ nguyên các phần import routes)
const authRoute = require("./route/authroute");
const userRoute = require("./route/userRoute");
const adminRoute = require("./route/adminRoute");
const appointmentRoute = require("./route/appointmentRoute");
const medicalRecordRoute = require("./route/medicalRecordRoute");
const reviewRoute = require("./route/reviewRoute");
const queueRoute = require("./route/queueRoute");
const scheduleRoute = require("./route/scheduleRoute");
const paymentRoute = require("./route/paymentRoute");

const app = express();

app.use(morgan("dev"));

// ✅ Cập nhật CORS để cho phép Vercel truy cập
app.use(
  cors({
    origin: ["http://localhost:5173"], // Link Vite ở máy bạn
    credentials: true,
  })
);

app.use(express.json());

// ✅ Cấu hình lại đường dẫn Static files cho đúng trên Server
// Nếu file server.js nằm trong src/, và folder uploads nằm cùng cấp với src/
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- Routes ---
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/appointments", appointmentRoute);
app.use("/api/v1/medical-records", medicalRecordRoute);
app.use("/api/v1/reviews", reviewRoute);
app.use("/api/v1/queue", queueRoute);
app.use("/api/v1/schedules", scheduleRoute);
app.use("/api/v1/payments", paymentRoute);

app.get("/", (req, res) => res.json({ ok: true, message: "CMS API is running" }));

// Port cho Render tự cấp
const PORT = process.env.PORT || 10000;

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`✅ Server is live on port ${PORT}`));
})();