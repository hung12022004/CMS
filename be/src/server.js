require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const connectDB = require("./config/db");
const authRoute = require("./route/authroute");
const userRoute = require("./route/userRoute");
const adminRoute = require("./route/adminRoute");
const app = express();

app.use(morgan("dev"));

// ✅ CORS (cho phép FE gọi từ Vite)
app.use(
  cors({
    origin: ["http://localhost:5173"], // Vite default
    credentials: true, // để sau này nếu dùng cookie cũng ok
  })
);

app.use(express.json());

// ✅ Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/admin", adminRoute);
app.get("/", (req, res) => res.json({ ok: true, message: "API running" }));

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
})();
