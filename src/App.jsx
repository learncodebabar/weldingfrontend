import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import AdminSignup from "./pages/adminPublic/signup/AdminSignup";
import AdminLogin from "./pages/adminPublic/Login/AdminLogin";
import Dashboard from "./pages/PrivatePage/Dashboard/Dashboard";
import PrivateRoute from "./Route/PrivateRoute";
import AddCustomer from "./pages/PrivatePage/AddCustomer/AddCustomer";
import Profile from "./pages/PrivatePage/Profile/Profile";
import AllCustomer from "./pages/PrivatePage/AllCustomer/AllCustomer";
import CustomerDetail from "./pages/PrivatePage/CustomerDetail/CustomerDetail";
import { ThemeProvider } from "./ThemeContext/ThemeContext";
import ThemeSettings from "./ThemeContext/ThemeSettings";
import AllOrders from "./pages/PrivatePage/AllOrders/AllOrders";
import AdminExpenses from "./pages/PrivatePage/AdminExpenses/AdminExpenses";
import AdminPayment from "./pages/PrivatePage/AdminPayment/AdminPayment";
import CustomerOrders from "./pages/PrivatePage/CustomerOrders/CustomerOrders";
import AddLabor from "./pages/PrivatePage/AddLabor/AddLabor";
import AllLabor from "./pages/PrivatePage/AllLabor/AllLabor";
import AttendancePage from "./pages/PrivatePage/Attendance/AttendancePage";
import WorkerDetailsPage from "./pages/PrivatePage/WorkerDetailsPage/WorkerDetailsPage";
import AccountSettings from "./pages/PrivatePage/AccountSettings/AccountSettings";
import EditLabor from "./pages/PrivatePage/EditLabor/EditLabor";
import API from "./api/axios";
import NotFound from "./pages/adminPublic/NotFound/NotFound";
import Roles from "./pages/PrivatePage/Roles/Roles";
import RoleLogin from "./pages/Role/RoleLogin/RoleLogin";








function App() {
  const [adminExists, setAdminExists] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Check if admin exists on app load
  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      setLoading(true);
      // Try to fetch any admin data
      const response = await API.get("/admin/check-exists");
      setAdminExists(response.data.exists);
    } catch (err) {
      console.error("Error checking admin:", err);
      // If endpoint doesn't exist, try alternative method
      try {
        // Try to fetch profile (will fail if no admin)
        await API.get("/admin/profile");
        setAdminExists(true);
      } catch (profileErr) {
        // If profile fetch fails with 404, no admin exists
        if (profileErr.response?.status === 404) {
          setAdminExists(false);
        } else {
          // Some other error, assume admin might exist
          setAdminExists(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading spinner while checking
  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Checking system status...</p>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* ✅ Public Routes with condition */}
          <Route 
            path="/Admin-Signup-Page" 
            element={
              // If admin exists, redirect to login
              adminExists ? <Navigate to="/" replace /> : <AdminSignup />
            } 
          />
          
          <Route path="/" element={<AdminLogin />} />

          {/* Private Routes (no change) */}
          <Route
            path="/Admin-Dashboard-overall"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
                <Route
            path="/add-roles"
            element={
              <PrivateRoute>
                <Roles />
              </PrivateRoute>
            }
          />
                   <Route
            path="/roles-login"
            element={
           
                <RoleLogin />
             
            }
          />
          <Route
            path="/Admin-Add-customer"
            element={
              <PrivateRoute>
                <AddCustomer />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/Worker-Details-Page/:id"
            element={
              <PrivateRoute>
                <WorkerDetailsPage />
              </PrivateRoute>
            }
          />

          <Route
            path="/edit-customer/:id"
            element={
              <PrivateRoute>
                <AddCustomer />
              </PrivateRoute>
            }
          />

          <Route
            path="/Admin-Profile-custoize"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/Admin-Account-Settings"
            element={
              <PrivateRoute>
                <AccountSettings />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/Attendance-Page"
            element={
              <PrivateRoute>
                <AttendancePage />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/edit-labor/:id"
            element={
              <PrivateRoute>
                <EditLabor />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/admin-all-customer"
            element={
              <PrivateRoute>
                <AllCustomer />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/Admin-Payment"
            element={
              <PrivateRoute>
                <AdminPayment />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/Add-Labor"
            element={
              <PrivateRoute>
                <AddLabor />
              </PrivateRoute>
            }
          />

          <Route
            path="/Customer-Detail/:id"
            element={
              <PrivateRoute>
                <CustomerDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/Theme-Settings"
            element={
              <PrivateRoute>
                <ThemeSettings />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/All-Labor"
            element={
              <PrivateRoute>
                <AllLabor />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/All-Orders"
            element={
              <PrivateRoute>
                <AllOrders />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/admin-expenses"
            element={
              <PrivateRoute>
                <AdminExpenses />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/customer-orders/:id"
            element={
              <PrivateRoute>
                <CustomerOrders />
              </PrivateRoute>
            }
          />

          {/* ✅ Catch all route - redirect to login if no match */}
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;