import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import ProtectedRoute from "../components/common/ProtectedRoute";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ProfilePage from "../pages/ProfilePage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import ResetPassword from "../pages/ResetPassword";
import VerifyOtpPage from "../pages/VerifyOtpPage";
import ForgotPasswordPage from "../pages/ForgetPasswordPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

// Healthcare Dashboard Pages
import DashboardPage from "../pages/DashboardPage";
import DoctorsPage from "../pages/DoctorsPage";
import BookingPage from "../pages/BookingPage";
import CheckoutPage from "../pages/CheckoutPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import MedicalRecordsPage from "../pages/MedicalRecordsPage";

// Admin Pages
import AdminUsersPage from "../pages/AdminUsersPage";

// Nurse Pages
import NursePatientsPage from "../pages/NursePatientsPage";
import NurseSchedulePage from "../pages/NurseSchedulePage";

// Check-in & Doctor Queue
import CheckInPage from "../pages/CheckInPage";
import DoctorQueuePage from "../pages/DoctorQueuePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        {/* Walk-in check-in — no login required */}
        <Route path="/checkin" element={<CheckInPage />} />

        {/* Protected: Tất cả user đã đăng nhập */}
        <Route element={<ProtectedRoute allowedRoles={[]} />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
        </Route>

        {/* Healthcare routes (Booking & Doctor list) */}
        <Route
          element={
            <ProtectedRoute allowedRoles={["patient", "doctor", "nurse", "admin"]} />
          }
        >
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/booking/:doctorId" element={<BookingPage />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
        </Route>

        {/* Patient + Doctor + Nurse */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["patient", "doctor", "nurse"]}
            />
          }
        >
          <Route path="/appointments" element={<AppointmentsPage />} />
          <Route path="/medical-records" element={<MedicalRecordsPage />} />
        </Route>

        {/* Nurse only */}
        <Route element={<ProtectedRoute allowedRoles={["nurse"]} />}>
          <Route path="/nurse/patients" element={<NursePatientsPage />} />
          <Route path="/nurse/schedule" element={<NurseSchedulePage />} />
        </Route>

        {/* Doctor only */}
        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route path="/doctor/queue" element={<DoctorQueuePage />} />
        </Route>

        {/* Dashboard: tất cả role đã đăng nhập */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={["patient", "doctor", "nurse", "admin"]}
            />
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>

        {/* Admin only */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/users" element={<AdminUsersPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
