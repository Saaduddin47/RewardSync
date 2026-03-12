import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import BGVDashboard from "./pages/BGVDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RoleGuard from "./hooks/useRoleGuard.jsx";

const App = () => (
  <Routes>
    <Route path="/login" element={<Login />} />

    <Route
      path="/recruiter"
      element={
        <RoleGuard allowedRoles={["recruiter"]}>
          <RecruiterDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/recruiter/submit-joiner"
      element={
        <RoleGuard allowedRoles={["recruiter"]}>
          <RecruiterDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/recruiter/my-claims"
      element={
        <RoleGuard allowedRoles={["recruiter"]}>
          <RecruiterDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/recruiter/target-progress"
      element={
        <RoleGuard allowedRoles={["recruiter"]}>
          <RecruiterDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/bgv"
      element={
        <RoleGuard allowedRoles={["bgv"]}>
          <BGVDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/bgv/pending-verifications"
      element={
        <RoleGuard allowedRoles={["bgv"]}>
          <BGVDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/bgv/all-joiners"
      element={
        <RoleGuard allowedRoles={["bgv"]}>
          <BGVDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/manager"
      element={
        <RoleGuard allowedRoles={["manager"]}>
          <ManagerDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/manager/incentive-claims"
      element={
        <RoleGuard allowedRoles={["manager"]}>
          <ManagerDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/manager/approval-queue"
      element={
        <RoleGuard allowedRoles={["manager"]}>
          <ManagerDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/manager/reports"
      element={
        <RoleGuard allowedRoles={["manager"]}>
          <ManagerDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/admin"
      element={
        <RoleGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/admin/employees"
      element={
        <RoleGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/admin/create-user"
      element={
        <RoleGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/admin/recovery-management"
      element={
        <RoleGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/admin/incentive-settings"
      element={
        <RoleGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </RoleGuard>
      }
    />
    <Route
      path="/admin/export-report"
      element={
        <RoleGuard allowedRoles={["admin"]}>
          <AdminDashboard />
        </RoleGuard>
      }
    />

    <Route path="*" element={<Navigate to="/login" replace />} />
  </Routes>
);

export default App;
