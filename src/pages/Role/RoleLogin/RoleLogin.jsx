import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import roleService from '../../../api/roleService';
import './RoleLogin.css';

// React Icons
import { 
  FaEnvelope, FaLock, FaEye, FaEyeSlash,
  FaCheckCircle, FaExclamationCircle, FaSpinner,
  FaShieldAlt, FaArrowLeft
} from 'react-icons/fa';

const RoleLogin = () => {
  const navigate = useNavigate();

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // UI State
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [errors, setErrors] = useState({});

  // Show toast message
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await roleService.roleLogin({
        email: email.toLowerCase().trim(),
        password: password
      });

      showToast('success', response.message || 'Login successful!');

      // Redirect to role dashboard after 1.5 seconds
      setTimeout(() => {
        navigate(`/role-dashboard/${response.user.id}`);
      }, 1500);

    } catch (err) {
      showToast('error', err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="role-login-container">
      {/* Decorative Background */}

      <div className="role-login-bg">
        <div className="role-bg-circle circle-11"></div>
        <div className="role-bg-circle circle-21"></div>
        <div className="role-bg-circle circle-31"></div>
      </div>

      {/* Toast Message */}
      {toast.show && (
        <div className={`role-toast ${toast.type}`}>
          <div className="role-toast-content">
            {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span>{toast.message}</span>
          </div>
          <button 
            className="role-toast-close" 
            onClick={() => setToast({ ...toast, show: false })}
          >
            ×
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="role-login-wrapper">
  

        {/* Login Card */}
        <div className="role-login-card">
          {/* Header */}
          <div className="role-login-header">
            <div className="role-icon-wrapper">
              <FaShieldAlt className="role-main-icon" />
            </div>
            <h1>Role Login</h1>
            <p>Sign in to access your role dashboard</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="role-login-form">
            {/* Email Field */}
            <div className="role-form-group">
              <label>
                <FaEnvelope className="role-field-icon" />
                Email Address
              </label>
              <div className="role-input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={loading}
                  className={errors.email ? 'error' : ''}
                />
                <FaEnvelope className="role-input-icon" />
              </div>
              {errors.email && <small className="role-error-text">{errors.email}</small>}
            </div>

            {/* Password Field */}
            <div className="role-form-group">
              <label>
                <FaLock className="role-field-icon" />
                Password
              </label>
              <div className="role-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={errors.password ? 'error' : ''}
                />
                <FaLock className="role-input-icon" />
                <button
                  type="button"
                  className="role-password-toggle"
                  onClick={togglePasswordVisibility}
                  disabled={loading}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <small className="role-error-text">{errors.password}</small>}
            </div>

            {/* Forgot Password Link */}
            <div className="role-forgot-password">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="role-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <FaSpinner className="role-spinning" />
                  Logging in...
                </>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="role-login-footer">
            <p>
              Don't have a role account?{' '}
              <Link to="/admin-signup">Contact Administrator</Link>
            </p>
            <div className="role-security-badge">
              <FaShieldAlt />
              <span>Secured by Role-Based Access</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RoleLogin;