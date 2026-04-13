const { Server } = require("socket.io");

let io;

module.exports = {
  init: (httpServer) => {
    io = new Server(httpServer, {
      cors: {
        origin: "*", // Cấu hình chi tiết hơn ở production
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
    });

    io.on("connection", (socket) => {
      console.log(`[Socket.io] Client connected: ${socket.id}`);

      // Bệnh nhân join room
      socket.on("join_patient_room", (patientId) => {
        socket.join(`room_patient_${patientId}`);
        console.log(`[Socket.io] ${socket.id} joined room_patient_${patientId}`);
      });

      // Khoa join room
      socket.on("join_dept_room", (serviceType) => {
        socket.join(`room_dept_${serviceType}`);
        console.log(`[Socket.io] ${socket.id} joined room_dept_${serviceType}`);
      });

      // Bác sĩ chính join room
      socket.on("join_doctor_room", (doctorId) => {
        socket.join(`room_doctor_${doctorId}`);
        console.log(`[Socket.io] ${socket.id} joined room_doctor_${doctorId}`);
      });

      socket.on("disconnect", () => {
        console.log(`[Socket.io] Client disconnected: ${socket.id}`);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error("Socket.io chưa được khởi tạo!");
    }
    return io;
  },
};
