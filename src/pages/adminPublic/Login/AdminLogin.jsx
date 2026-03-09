import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../../../api/axios";
import "./AdminLogin.css";

// React Icons
import { 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaShieldAlt,
  FaUserCircle,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationCircle,
  FaSpinner
} from "react-icons/fa";

export default function AdminLogin() {
  const navigate = useNavigate();

  // States for login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // States for OTP
  const [step, setStep] = useState("login"); // 'login' or 'otp'
  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]); // 8-digit OTP
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  // UI States
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

  // Start resend timer
  const startResendTimer = () => {
    setCanResend(false);
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/admin/login", { email, password });
      
      if (res.data.requiresOTP) {
        setStep("otp");
        startResendTimer();
        showToastMessage("Verification code sent to your email!", "success");
      } else {
        localStorage.setItem("adminToken", res.data.token);
        showToastMessage("Login successful! Redirecting to dashboard...", "success");
        setTimeout(() => navigate("/Admin-Dashboard-overall"), 1500);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid email or password";
      showToastMessage(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 7) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  // Handle OTP keydown (backspace)
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus the next empty input or last input
    const nextIndex = Math.min(pastedData.length, 7);
    const nextInput = document.getElementById(`otp-${nextIndex}`);
    if (nextInput) nextInput.focus();
  };

  // Verify OTP handler
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    const otpString = otp.join("");
    if (otpString.length !== 8) {
      showToastMessage("Please enter complete 8-digit code", "error");
      return;
    }

    setLoading(true);

    try {
      const res = await API.post("/admin/verify-otp", { 
        email, 
        otp: otpString 
      });
      
      localStorage.setItem("adminToken", res.data.token);
      showToastMessage("Login successful! Redirecting to dashboard...", "success");
      setTimeout(() => navigate("/Admin-Dashboard-overall"), 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Invalid verification code";
      showToastMessage(errorMessage, "error");
      
      // Clear OTP inputs on error
      setOtp(["", "", "", "", "", "", "", ""]);
      
      // Focus first input
      const firstInput = document.getElementById("otp-0");
      if (firstInput) firstInput.focus();
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    if (!canResend) return;

    setLoading(true);
    try {
      await API.post("/admin/resend-otp", { email });
      showToastMessage("New verification code sent to your email!", "success");
      startResendTimer();
      
      // Clear OTP inputs
      setOtp(["", "", "", "", "", "", "", ""]);
      
      // Focus first input
      const firstInput = document.getElementById("otp-0");
      if (firstInput) firstInput.focus();
    } catch (err) {
      showToastMessage("Failed to resend code. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Go back to login
  const handleBackToLogin = () => {
    setStep("login");
    setOtp(["", "", "", "", "", "", "", ""]);
  };

  return (
    <div className="admin-login-container">
      {/* Decorative Background Bubbles */}
      <div className="admin-login-bg">
        <div className="login-bg-circle login-circle-1"></div>
        <div className="login-bg-circle login-circle-2"></div>
        <div className="login-bg-circle login-circle-3"></div>
        <div className="login-bg-circle login-circle-4"></div>
        <div className="login-bg-circle login-circle-5"></div>
        <div className="login-bg-circle login-circle-6"></div>
        <div className="login-bg-circle login-circle-7"></div>
        <div className="login-bg-circle login-circle-8"></div>
      </div>

      {/* Toast Message */}
      {toast.show && (
        <div className={`toast-message ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
            <span className="toast-text">{toast.message}</span>
          </div>
          <button className="toast-close" onClick={handleCloseToast}>×</button>
        </div>
      )}

      <div className="login-card">
        {/* Decorative Elements */}
        <div className="card-shape shape-1"></div>
        <div className="card-shape shape-2"></div>
        
        {step === "login" ? (
          /* Login Form */
          <>
            <div className="login-header">
              <div className="login-icon-wrapper">
                <FaUserCircle className="login-main-icon" />
              </div>
              <p className="login-subtitle">Welcome back! Please login to your account</p>
            </div>

            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="form-group">
                <label htmlFor="email">
                  <FaEnvelope className="input-icon" /> Email Address <span className="required">*</span>
                </label>
                <div className="input-wrapper">
                  <input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className={toast.show && toast.type === 'error' ? 'error' : ''}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <FaLock className="input-icon" /> Password <span className="required">*</span>
                </label>
                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className={toast.show && toast.type === 'error' ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`submit-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? <><FaSpinner className="spinning" /> Authenticating...</> : 'Login to Dashboard'}
              </button>
            </form>
          </>
        ) : (
          /* OTP Verification Form */
          <>
            <div className="login-header">
              <div className="login-icon-wrapper">
                <FaShieldAlt className="login-main-icon" />
              </div>
              <h1 className="login-title">Verification Code</h1>
              <p className="login-subtitle">
                Enter the 8-digit code sent to<br />
                <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyOTP} className="otp-form">
              <div className="otp-input-group">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={index === 0 ? handleOtpPaste : undefined}
                    className="otp-input"
                    autoFocus={index === 0}
                    disabled={loading}
                  />
                ))}
              </div>

              <div className="otp-timer">
                {!canResend ? (
                  <span><FaShieldAlt /> Resend code in <strong>{timer}s</strong></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="resend-btn"
                    disabled={loading}
                  >
                    <FaShieldAlt /> Resend Code
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || otp.join("").length !== 8}
                className={`submit-btn ${loading ? 'loading' : ''}`}
              >
                {loading ? <><FaSpinner className="spinning" /> Verifying...</> : 'Verify & Login'}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="back-btn"
                disabled={loading}
              >
                <FaArrowLeft /> Back to Login
              </button>
            </form>
          </>
        )}

        <div className="login-footer">
          <p className="register-link">
            Don't have an account?{' '}
            <Link to="/Admin-Signup-Page" className="register-link-text">
              Signup
            </Link>
          </p>
          <div className="security-note">
            <FaShieldAlt className="security-icon" />
            <span>Secured by 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}