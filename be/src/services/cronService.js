const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const DailyStats = require("../models/DailyStats");

// Setup cron job chạy vào 2h sáng mỗi ngày ("0 2 * * *")
exports.initCronJobs = () => {
  cron.schedule("0 2 * * *", async () => {
    console.log("Bat dau chay cron job: Tinh toan doanh thu ngay hom qua...");
    
    try {
      // Lấy ngày hôm qua (theo UTC hoặc local dựa trên server, ta dùng JS chuẩn định dạng YYYY-MM-DD)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const targetDate = yesterday.toISOString().split("T")[0];

      // Sử dụng aggregate để tính toán (Tùy chọn cho node-cron, hoặc có thể countDocuments nếu đơn giản, nhưng epic yêu cầu dùng aggregate mạnh)
      const stats = await Appointment.aggregate([
        {
          $match: {
            date: targetDate,   // Lọc các appointment có ngày bằng targetDate
            paymentStatus: "paid" // Bắt buộc phải là đã thanh toán
          }
        },
        {
          $group: {
            _id: "$date",
            totalPatients: { $sum: 1 },
            // Mọi lịch hẹn thanh toán đều được cấu hình giá mặc định là 300,000 VND từ controller thanh toán
            totalRevenue: { $sum: 300000 } 
          }
        }
      ]);

      const result = stats.length > 0 ? stats[0] : { totalPatients: 0, totalRevenue: 0 };

      // Lưu trữ trạng thái vào bảng DailyStats để cho Report Overview
      await DailyStats.findOneAndUpdate(
        { date: targetDate },
        { 
          totalPatients: result.totalPatients,
          totalRevenue: result.totalRevenue 
        },
        { upsert: true, new: true }
      );

      console.log(`Luu DailyStats thanh cong cho ngay ${targetDate}:`, result);
    } catch (error) {
      console.error("Loi trong cron job tinh doanh thu:", error);
    }
  });
};
