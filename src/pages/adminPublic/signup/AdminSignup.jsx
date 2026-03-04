import React, { useState, useEffect } from "react";
import API from "../../../api/axios";
import { useNavigate, Link } from "react-router-dom";
import "./AdminSignup.css";

const AdminSignup = () => {
  const navigate = useNavigate();
  
  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  // UI state
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });

  const [message, setMessage] = useState({ 
    type: "", 
    text: "", 
    visible: false 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({});

  // Auto hide message after 5 seconds
  useEffect(() => {
    if (message.visible) {
      const timer = setTimeout(() => {
        setMessage(prev => ({ ...prev, visible: false }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message.visible]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (message.visible) {
      setMessage({ type: "", text: "", visible: false });
    }
  };

  // Handle input blur
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Show message
  const showMessage = (type, text) => {
    setMessage({ type, text, visible: true });
  };

  // Validate form
  const validateForm = () => {
    if (!form.name.trim()) {
      showMessage("error", "Please enter your full name");
      return false;
    }
    if (form.name.trim().length < 3) {
      showMessage("error", "Name must be at least 3 characters");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email) {
      showMessage("error", "Please enter your email");
      return false;
    }
    if (!emailRegex.test(form.email)) {
      showMessage("error", "Please enter a valid email");
      return false;
    }

    if (!form.password) {
      showMessage("error", "Please enter a password");
      return false;
    }

    if (!form.confirmPassword) {
      showMessage("error", "Please confirm your password");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      showMessage("error", "Passwords do not match");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const res = await API.post("/admin/signup", {
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        password: form.password
      });
      
      showMessage("success", res.data.message || "Registration successful! Redirecting to login...");
      
      setForm({
        name: "",
        email: "",
        password: "",
        confirmPassword: ""
      });
      
      setTimeout(() => {
        navigate("/Admin-Login-Page");
      }, 2000);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Something went wrong. Please try again.";
      showMessage("error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-signup-container">
      {/* Toast Message */}
      {message.visible && (
        <div className={`toast-message ${message.type}`}>
          <div className="toast-content">
            <span className="toast-text">{message.text}</span>
          </div>
          <button 
            className="toast-close"
            onClick={() => setMessage(prev => ({ ...prev, visible: false }))}
          >
            ×
          </button>
        </div>
      )}

      <div className="signup-card">
        {/* Header */}
        <div className="signup-header">
          <h1 className="signup-title">
            Welding Software
          
          </h1>
          <p className="signup-subtitle">
            Create your administrator account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-signup-form">
          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={() => handleBlur('name')}
              placeholder="Enter your full name"
              disabled={isLoading}
              className={`admin-signup-name-input ${touched.name && !form.name ? "error" : ""}`}
            />
          </div>

          {/* Email Field */}
          <div className="form-group">
            <label htmlFor="email">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              onBlur={() => handleBlur('email')}
              placeholder="Enter your email"
              disabled={isLoading}
              className={`admin-signup-email-input ${touched.email && !form.email ? "error" : ""}`}
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              Password <span className="required">*</span>
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword.password ? "text" : "password"}
                id="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                onBlur={() => handleBlur('password')}
                placeholder="Enter your password"
                disabled={isLoading}
                className="admin-signup-password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("password")}
              >
                {showPassword.password ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password <span className="required">*</span>
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword.confirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={() => handleBlur('confirmPassword')}
                placeholder="Confirm your password"
                disabled={isLoading}
                className="admin-signup-confirm-password-input"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => togglePasswordVisibility("confirmPassword")}
              >
                {showPassword.confirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className={`submit-btn ${isLoading ? "loading" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Admin Account"}
          </button>
        </form>

        {/* Footer */}
        <div className="signup-footer">
          <p className="login-link">
            Already have an account?{" "}
            <Link to="/" className="login-link-text">
              Login 
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;