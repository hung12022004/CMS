require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketConfig = require("./socket");

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
const encounterRoute = require("./route/encounterRoute");
const serviceRequestRoute = require("./route/serviceRequestRoute");
const reportRoute = require("./route/reportRoute");
const { initCronJobs } = require("./services/cronService");

const app = express();

app.use(morgan("dev"));

// CORS: Cho phép tất cả request từ local (LAN + localhost)
app.use(
  cors({
    origin: true, // Chấp nhận mọi origin (localhost, 192.168.x.x, v.v.)
    credentials: true,
  })
);

app.use(express.json());

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
app.use("/api/v1/encounters", encounterRoute);
app.use("/api/v1/services", serviceRequestRoute);
app.use("/api/v1/reports", reportRoute);

app.get("/", (req, res) => res.json({ ok: true, message: "CMS API is running" }));

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
socketConfig.init(server);

(async () => {
  await connectDB();
  initCronJobs(); // Kích hoạt Cronjob báo cáo
  server.listen(PORT, () => console.log(`✅ Server is live on port ${PORT}`));
})();