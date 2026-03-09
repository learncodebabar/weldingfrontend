import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { ViteBackendIP } from "../../api/Vite_React_Backend_Base";

const OwnerLogin = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking");
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 Backend URL from config:", ViteBackendIP);
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const testUrl = `${ViteBackendIP}/health`;
      console.log("🔄 Testing connection to:", testUrl);
      
      const response = await fetch(testUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("✅ Connection successful:", data);
        setConnectionStatus("connected");
      } else {
        console.log("⚠️ Connection failed with status:", response.status);
        setConnectionStatus("failed");
      }
    } catch (err) {
      console.error("❌ Connection error:", err);
      setConnectionStatus("failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError("Password is required");
      setLoading(false);
      return;
    }

    try {
      const url = `${ViteBackendIP}/auth/owner/login`;
      console.log("🔑 Logging in at:", url);
      
      const requestData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("✅ Login response:", data);

      if (!response.ok) {
        throw new Error(data.message || data.error || "Login failed");
      }

      const token = data.token || data.data?.token;
      const user = data.user || data.data?.user;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      login(token, user);
      navigate("/");
    } catch (err) {
      console.error("❌ Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row">
        <div className="col-12 pt-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-link text-warning text-decoration-none p-0"
            style={{ fontSize: "1.1rem" }}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Back
          </button>
        </div>
      </div>

      <div
        className="row justify-content-center align-items-center"
        style={{ minHeight: "90vh" }}
      >
        <div className="col-md-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <i
                  className="bi bi-shield-lock-fill text-warning"
                  style={{ fontSize: "3rem" }}
                ></i>
                <h2 className="mt-3">Owner Access</h2>
                <p className="text-muted small">Secure login portal</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  {error}
                </div>
              )}

              {/* Connection Status */}
              {connectionStatus === "checking" && (
                <div className="alert alert-info py-2">
                  <i className="bi bi-arrow-repeat me-2"></i>
                  Testing connection...
                </div>
              )}
              {connectionStatus === "connected" && (
                <div className="alert alert-success py-2">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Connected to server
                </div>
              )}
              {connectionStatus === "failed" && (
                <div className="alert alert-warning py-2">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>
                  Cannot reach server - check if backend is running at {ViteBackendIP}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    autoFocus
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="text-end mb-3">
                  <Link
                    to="/forgot-password"
                    className="text-warning text-decoration-none small"
                  >
                    <i className="bi bi-question-circle me-1"></i>
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn btn-warning w-100 btn-lg text-white fw-bold"
                  disabled={loading || connectionStatus === "checking"}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right me-2"></i>
                      Login as Owner
                    </>
                  )}
                </button>

                <p className="text-center mt-3 mb-0">
                  Not registered?{" "}
                  <Link to="/owner-register" className="text-warning">
                    <i className="bi bi-person-plus me-1"></i>
                    Register Here
                  </Link>
                </p>
              </form>
              
              <div className="mt-3 text-center small text-muted">
                <i className="bi bi-plug me-1"></i>
                API: {ViteBackendIP}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerLogin;