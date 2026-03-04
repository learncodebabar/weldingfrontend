import { BrowserRouter, Routes, Route } from "react-router-dom";
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





function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Routes */}
          <Route path="/Admin-Signup-Page" element={<AdminSignup />} />
          <Route path="/" element={<AdminLogin />} />

          {/* Private Routes */}
          <Route
            path="/Admin-Dashboard-overall"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
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

        </Routes>



        
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;