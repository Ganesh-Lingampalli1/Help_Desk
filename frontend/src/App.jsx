import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";

// Layout
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Error Pages
import Unauthorized from "./pages/errors/Unauthorized";
import NotFound from "./pages/errors/NotFound";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import CreateTicket from "./pages/employee/CreateTicket";
import MyTickets from "./pages/employee/MyTickets";

// Agent Pages
import AgentDashboard from "./pages/agent/AgentDashboard";
import AssignedTickets from "./pages/agent/AssignedTickets";
import TicketQueue from "./pages/agent/TicketQueue";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AllTickets from "./pages/admin/AllTickets";
import UserManagement from "./pages/admin/UserManagement";
import AnalyticsReports from "./pages/admin/AnalyticsReports";
import Settings from "./pages/admin/Settings";

// Shared Pages
import TicketDetail from "./pages/tickets/TicketDetail";
import UserProfile from "./pages/profile/UserProfile";
import Notifications from "./pages/notifications/Notifications";

// Role-based root dashboard router
const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === "admin") {
    return <AdminDashboard />;
  }
  if (user?.role === "agent") {
    return <AgentDashboard />;
  }
  return <EmployeeDashboard />;
};

export const App = () => {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#0f172a",
            border: "1px solid #e2e8f0",
            fontSize: "13px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
            borderRadius: "0.5rem",
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected Application Routes wrapped in AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Main Dashboard (adaptive by role) */}
          <Route path="/" element={<DashboardRouter />} />

          {/* Profile & Notifications (All logged in users) */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/notifications" element={<Notifications />} />

          {/* Ticket Detail (Accessible by authorized parties: creator, assigned agent, admin) */}
          <Route path="/tickets/:id" element={<TicketDetail />} />

          {/* Employee Routes */}
          <Route
            path="/tickets/new"
            element={
              <ProtectedRoute allowedRoles={["employee", "admin"]}>
                <CreateTicket />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <MyTickets />
              </ProtectedRoute>
            }
          />

          {/* Support Agent Routes */}
          <Route
            path="/agent/assigned"
            element={
              <ProtectedRoute allowedRoles={["agent", "admin"]}>
                <AssignedTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agent/queue"
            element={
              <ProtectedRoute allowedRoles={["agent", "admin"]}>
                <TicketQueue />
              </ProtectedRoute>
            }
          />

          {/* Administrator Routes */}
          <Route
            path="/admin/tickets"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AllTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AnalyticsReports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
