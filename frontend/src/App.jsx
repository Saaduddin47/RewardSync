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
      path="/bgv"
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
      path="/admin"
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
