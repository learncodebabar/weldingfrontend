import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../../api/axios";
import "./AdminLogin.css";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Toast close handler
  const handleCloseToast = () => {
    setToast({ ...toast, show: false });
  };

  // Show toast message
  const showToastMessage = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" });
    }, 5000);
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/admin/login", { email, password });
      localStorage.setItem("adminToken", res.data.token);
      showToastMessage("Login successful! Redirecting to dashboard...", "success");
      
      setTimeout(() => navigate("/Admin-Dashboard-overall"), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid email or password";
      showToastMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (

       

    <div className="admin-login-container">
      {/* Toast Message */}
      {toast.show && (
        <div className={`toast-message ${toast.type}`}>
          <div className="toast-content">
            <span className="toast-text">{toast.message}</span>
          </div>
          <button className="toast-close" onClick={handleCloseToast}>×</button>
        </div>
      )}

      <div className="login-card">
        {/* Decorative Elements */}
        <div className="card-shape shape-1"></div>
        <div className="card-shape shape-2"></div>
        
        <div className="login-header">
          <h1 className="login-title">
            Admin Portal
           
          </h1>
          <p className="login-subtitle">Welcome back! Please login to your account</p>
        </div>

        <form onSubmit={handleLogin} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={toast.show && toast.type === 'error' ? 'error' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={toast.show && toast.type === 'error' ? 'error' : ''}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`submit-btn ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Login to Dashboard'}
          </button>
        </form>

        <div className="login-footer">
          <p className="register-link">
            Don't have an account?{' '}
            <Link to="/Admin-Signup-Page" className="register-link-text">
              Signup
            </Link>
          </p>
       
        </div>
      </div>
    </div>
  );
}