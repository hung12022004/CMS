import { io } from "socket.io-client";

// Sử dụng VITE_API_URL hoặc mặc định
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Tự connect khi cần (chỉ khi login)
});

// Các utils hỗ trợ
export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};

// Hàm tiện ích gửi emit gia nhập các room
export const joinPatientRoom = (patientId) => {
  socket.emit("join_patient_room", patientId);
};

export const joinDeptRoom = (serviceType) => {
  socket.emit("join_dept_room", serviceType);
};

export const joinDoctorRoom = (doctorId) => {
  socket.emit("join_doctor_room", doctorId);
};
