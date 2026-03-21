# Clinic Management System (CMS)

A full-stack web application designed for managing clinic operations, including appointments, patient medical records, roles (Doctors, Nurses, Patients, Admin), and staff coordination.

## 🛠 Tech Stack

### Frontend (`/fe`)
- **Framework**: React.js (built with Vite)
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v7)
- **HTTP Client**: Axios
- **Authentication**: Google OAuth (`@react-oauth/google`)

### Backend (`/be`)
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JSON Web Token (JWT) & Google Auth Library
- **Others**: Bcrypt.js (password hashing), Multer (file uploads), Nodemailer (email services)

## 📋 Prerequisites

- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)
- NPM or Yarn package manager

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone <repository_url>
cd CMS
```

### 2. Backend Setup (`/be`)

Di chuyển vào thư mục backend và cài đặt các thư viện:
```bash
cd be
npm install
```

Tạo file `.env` trong thư mục `be` và cấu hình các biến môi trường cần thiết (tham khảo hoặc yêu cầu các biến môi trường thực tế từ dev team):
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
# Cấu hình Google Auth, Nodemailer (nếu có)
```

Khởi chạy server backend:
```bash
npm run dev
```
*(Server sẽ chạy tại `http://localhost:5000`)*

### 3. Frontend Setup (`/fe`)

Mở một terminal mới, di chuyển vào thư mục frontend và cài đặt thư viện:
```bash
cd fe
npm install
```

Tạo file `.env` trong thư mục `fe` (nếu cần thiết để cung cấp API URL, Client ID,...):
```env
VITE_API_BASE_URL=http://localhost:5000
# VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Khởi chạy ứng dụng react:
```bash
npm run dev
```

## ✨ Features (Tính năng chính)

- Xác thực & Phân quyền người dùng (Patients, Nurses, Doctors, Admins).
- Đăng nhập bảo mật thông qua tài khoản thông thường hoặc Google OAuth.
- Quản lý lịch tư vấn và khám bệnh (Appointments).
- Quản lý hồ sơ bệnh án (Medical Records).
- Giao diện người dùng responsive và hiện đại với Tailwind CSS.
