import { useState, useEffect, useRef } from "react";
import api from "../api/api";
import { useNotifications } from "../context/NotificationContext";
import { API_ENDPOINTS } from "../api/EndPoints";
import QRCode from "qrcode";
import BackupButton from "../components/BackupButton";
import NetworkInfo from "../components/NetworkInfo";
import { VITE_BACKEND_URL } from "../config/config";
import MEGAConnectionManager from '../components/MEGAConnectionManager';

export default function Setting() {
  const [formData, setFormData] = useState({
    shopName: "",
    address: "",
    location: "",
    phone: "",
    email: "",
    about: "",
    logo: null,
  });

  const [previewLogo, setPreviewLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [environment, setEnvironment] = useState('');
  const [networkUrl, setNetworkUrl] = useState('');

  const { addNotification } = useNotifications();
  const canvasRef = useRef(null);
  const qrContainerRef = useRef(null);

  // Helper function to detect environment
  const getEnvironment = () => {
    // Check if running in Electron
    if (window?.process?.type === 'renderer' || window?.process?.versions?.electron) {
      return 'electron';
    }
    // Check if running in development mode
    if (import.meta.env.DEV) {
      return 'development';
    }
    // Production build in browser
    return 'production';
  };

  // Try to get the network URL from Vite
  const getViteNetworkUrl = () => {
    // In development, Vite shows the network URL in the console
    // We can try to construct it from the current host
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const port = '5173'; // Vite default port
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `${protocol}//${hostname}:${port}`;
    }
    
    // Try to get from meta tags or window object
    if (import.meta.env.VITE_NETWORK_URL) {
      return import.meta.env.VITE_NETWORK_URL;
    }
    
    return null;
  };

  // Get local IP addresses
  const getLocalIPs = () => {
    return new Promise((resolve) => {
      const ips = [];
      let timeout = setTimeout(() => {
        // Fallback after timeout
        console.log("IP detection timeout, using fallback");
        resolve('10.12.19.76'); // Your specific IP from the Vite output
      }, 3000);
      
      // Try to get IP from RTCPeerConnection (most accurate)
      try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer)).catch(e => {
          console.error("Failed to create offer:", e);
        });
        
        pc.onicecandidate = (ice) => {
          if (!ice || !ice.candidate) {
            // All candidates gathered
            clearTimeout(timeout);
            if (ips.length > 0) {
              console.log("Found IPs:", ips);
              resolve(ips[0]); // Return first IP found
            } else {
              resolve('10.12.19.76'); // Your specific IP
            }
            return;
          }
          
          // Parse IP from candidate
          const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
          const match = ice.candidate.match(ipRegex);
          if (match && match[1]) {
            const ip = match[1];
            // Filter out loopback and link-local addresses
            if (!ip.startsWith('127.') && !ip.startsWith('169.254.')) {
              if (!ips.includes(ip)) {
                ips.push(ip);
                console.log("Found IP:", ip);
              }
            }
          }
        };
        
      } catch (e) {
        console.error("RTCPeerConnection failed:", e);
        clearTimeout(timeout);
        resolve('10.12.19.76'); // Your specific IP
      }
    });
  };

  useEffect(() => {
    fetchShopSettings();
    setEnvironment(getEnvironment());
    
    // Try to get the network URL
    const viteNetworkUrl = getViteNetworkUrl();
    if (viteNetworkUrl) {
      setNetworkUrl(viteNetworkUrl);
      console.log("Found Vite network URL:", viteNetworkUrl);
    }
    
    console.log("Environment:", getEnvironment());
    console.log("Window location:", window.location.href);
  }, []);

  useEffect(() => {
    // Generate QR code when modal is shown and we have a URL
    if (showQR && qrUrl && canvasRef.current && !qrGenerated) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        generateQRCode();
      }, 100);
    }
  }, [showQR, qrUrl, qrGenerated]);

  const fetchShopSettings = async () => {
    try {
      console.log("📥 Fetching shop settings...");
      const res = await api.get(API_ENDPOINTS.SHOP_SETTINGS);
      console.log("✅ Shop settings response:", res.data);
      
      // Handle different response structures
      const data = res.data || {};

      setFormData({
        shopName: data.shopName || "",
        address: data.address || "",
        location: data.location || "",
        phone: data.phone || "",
        email: data.email || "",
        about: data.about || "",
        logo: null,
      });

      // Handle logo URL
      if (data.logo) {
        console.log("Logo path:", data.logo);
        
        // If it's a full URL
        if (data.logo.startsWith('http')) {
          setPreviewLogo(data.logo);
        } 
        // If it's a base64 image
        else if (data.logo.startsWith('data:image')) {
          setPreviewLogo(data.logo);
        }
        // If it's a relative path
        else {
          // Remove any leading /api or /
          const cleanPath = data.logo.replace(/^\/?(api\/)?/, '');
          const logoUrl = `${VITE_BACKEND_URL}/${cleanPath}`;
          console.log("Constructed logo URL:", logoUrl);
          setPreviewLogo(logoUrl);
        }
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching shop settings:", err);
      addNotification("error", "Failed to load shop settings");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Logo file selected:", file.name, file.type, file.size);
      setFormData((prev) => ({ ...prev, logo: file }));
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      console.log("💾 Saving shop settings...");
      
      const form = new FormData();
      form.append("shopName", formData.shopName || "");
      form.append("address", formData.address || "");
      form.append("location", formData.location || "");
      form.append("phone", formData.phone || "");
      form.append("email", formData.email || "");
      form.append("about", formData.about || "");

      if (formData.logo) {
        form.append("logo", formData.logo);
        console.log("Logo attached to form data");
      }

      const response = await api.post(API_ENDPOINTS.SHOP_SETTINGS, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("✅ Settings saved:", response.data);
      
      addNotification("success", "Shop settings updated successfully!");
      await fetchShopSettings(); // Refresh data
      setFormData((prev) => ({ ...prev, logo: null }));
    } catch (err) {
      console.error("❌ Error saving settings:", err);
      console.error("Error response:", err.response?.data);
      
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message ||
                          "Failed to update settings";
      
      addNotification("error", errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const generateQRCode = async () => {
    try {
      console.log("Generating QR code for URL:", qrUrl);
      console.log("Canvas ref:", canvasRef.current);
      
      if (!canvasRef.current) {
        console.error("Canvas ref is null");
        return;
      }

      // Clear the canvas first
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      // Generate QR code
      await QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });

      console.log("QR Code generated successfully");
      setQrGenerated(true);
      
    } catch (err) {
      console.error("QR Code generation error:", err);
      addNotification("error", "Failed to generate QR code: " + err.message);
    }
  };

  const generateQR = async () => {
    try {
      setQrGenerated(false);
      setShowQR(true);
      
      const currentEnv = getEnvironment();
      let url;
      let displayMessage = "";
      
      console.log("Current environment:", currentEnv);
      
      if (currentEnv === 'development') {
        // In development, use the network URL from Vite
        const ip = '10.12.19.76'; // Your specific IP from the Vite output
        const port = '5173';
        url = `http://${ip}:${port}`;
        displayMessage = "📱 Scan to open the Vite dev server on your mobile:";
      } else if (currentEnv === 'electron') {
        // In Electron, use the backend URL
        const ip = '10.12.19.76'; // Your specific IP
        const port = '3000'; // Your backend port
        url = `http://${ip}:${port}`;
        displayMessage = "📱 Scan to open the web app on your mobile:";
      } else {
        // Production
        url = window.location.origin;
        displayMessage = "📱 Scan to open this app on your mobile:";
      }
      
      console.log("📱 QR Code URL:", url);
      setQrUrl(url);
      
      addNotification("info", displayMessage);
      
    } catch (err) {
      console.error("QR Error:", err);
      addNotification("error", "Failed to generate QR code: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <h2 className="fw-bold mb-4">Shop Settings</h2>
      
      <BackupButton />
      <MEGAConnectionManager />

      {/* Vite Network Info Banner */}
      {environment === 'development' && (
        <div className="alert alert-success mb-4">
          <i className="bi bi-wifi me-2"></i>
          <strong>Vite Network URL:</strong> 
          <code className="ms-2 bg-light p-2 rounded">http://10.12.19.76:5173/</code>
          <br />
          <small className="text-muted">Use this URL to access from mobile devices on the same network</small>
        </div>
      )}

      {/* QR Code Section */}
      <div className="mb-4">
        <div className="card shadow-sm border-0">
          <div className="card-body">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="mb-2">📱 Access on Mobile</h5>
                <p className="text-muted mb-0">
                  {environment === 'development' 
                    ? "Scan the QR code to open the Vite development server on your mobile phone. Make sure your phone is connected to the same WiFi network."
                    : environment === 'electron'
                    ? "Scan the QR code to open the web version on your mobile phone."
                    : "Scan the QR code to open this app on your mobile phone."
                  }
                </p>
                {environment === 'development' && (
                  <div className="mt-2 p-2 bg-light rounded">
                    <small>
                      <strong>Vite Server:</strong> 
                      <br />
                      <span className="text-success">➜ Local: http://localhost:5173/</span>
                      <br />
                      <span className="text-primary">➜ Network: http://10.12.19.76:5173/</span>
                    </small>
                  </div>
                )}
                {qrUrl && (
                  <p className="mt-2 mb-0">
                    <strong>QR URL:</strong> 
                    <code className="ms-2 bg-light p-1 rounded">{qrUrl}</code>
                  </p>
                )}
              </div>
              <div className="col-md-4 text-end">
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={generateQR}
                >
                  <i className="bi bi-qr-code-scan me-2"></i>
                  Show QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-phone me-2"></i>
                  {environment === 'development' ? 'Vite Dev Server' : 'Access on Mobile'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowQR(false);
                    setQrGenerated(false);
                  }}
                ></button>
              </div>
              <div className="modal-body text-center p-4">
                {environment === 'development' && (
                  <div className="alert alert-success mb-3">
                    <i className="bi bi-info-circle me-2"></i>
                    <strong>Vite Network URL:</strong>
                    <br />
                    <code className="mt-2 d-block p-2 bg-white">http://10.12.19.76:5173/</code>
                  </div>
                )}

                <div 
                  ref={qrContainerRef}
                  className="bg-light p-4 rounded d-inline-block"
                  style={{ minWidth: '250px', minHeight: '250px' }}
                >
                  <canvas 
                    ref={canvasRef} 
                    className="img-fluid"
                    style={{ 
                      width: '250px', 
                      height: '250px',
                      display: qrGenerated ? 'block' : 'none'
                    }}
                  ></canvas>
                  
                  {!qrGenerated && (
                    <div 
                      className="d-flex align-items-center justify-content-center"
                      style={{ width: '250px', height: '250px' }}
                    >
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Generating QR Code...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4">
                  <p className="mb-2">
                    <strong>📡 Network Info:</strong>
                  </p>
                  <div className="bg-light p-3 rounded">
                    <p className="mb-1">
                      <i className="bi bi-wifi me-2"></i>
                      Same WiFi required
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-hdd-network me-2"></i>
                      IP: 10.12.19.76
                    </p>
                    <p className="mb-0">
                      <i className="bi bi-plug me-2"></i>
                      Port: 5173
                    </p>
                  </div>
                </div>

                <div className="alert alert-info mt-3 mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Open your phone's camera and scan the QR code
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowQR(false);
                    setQrGenerated(false);
                  }}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(qrUrl);
                    addNotification("success", "URL copied to clipboard!");
                  }}
                >
                  <i className="bi bi-clipboard me-2"></i>
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <NetworkInfo />

      {/* Settings Form */}
      <div className="card shadow-sm border-0">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Shop Logo */}
              <div className="col-12 text-center mb-4">
                <label className="form-label fw-medium d-block">
                  Shop Logo
                </label>

                {previewLogo ? (
                  <img
                    src={previewLogo}
                    alt="Shop Logo"
                    className="img-fluid rounded-circle mb-3"
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                      border: "3px solid #ddd",
                    }}
                    onError={(e) => {
                      console.error("Logo failed to load:", previewLogo);
                      e.target.style.display = 'none';
                      // Show fallback
                      const parent = e.target.parentElement;
                      if (parent && !parent.querySelector('.fallback-logo')) {
                        const fallbackDiv = document.createElement('div');
                        fallbackDiv.className = 'bg-light rounded-circle d-flex align-items-center justify-content-center mb-3 mx-auto fallback-logo';
                        fallbackDiv.style.width = '150px';
                        fallbackDiv.style.height = '150px';
                        fallbackDiv.innerHTML = '<i className="bi bi-shop fs-1 text-muted"></i>';
                        parent.appendChild(fallbackDiv);
                      }
                    }}
                  />
                ) : (
                  <div
                    className="bg-light rounded-circle d-flex align-items-center justify-content-center mb-3 mx-auto"
                    style={{ width: "150px", height: "150px" }}
                  >
                    <i className="bi bi-shop fs-1 text-muted"></i>
                  </div>
                )}

                <input
                  type="file"
                  className="form-control form-control-sm w-50 mx-auto"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <small className="text-muted d-block mt-2">
                  Recommended: 1:1 ratio (PNG/JPG, max 2MB)
                </small>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">Shop Name *</label>
                <input
                  type="text"
                  className="form-control"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">
                  Email (for notifications)
                </label>
                <input
                  type="email"
                  className="form-control"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-medium">
                  Location (City/Area)
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g., Lahore, Punjab"
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-medium">Full Address</label>
                <textarea
                  className="form-control"
                  rows="3"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="col-12">
                <label className="form-label fw-medium">About Shop</label>
                <textarea
                  className="form-control"
                  rows="4"
                  name="about"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Short description about your shop..."
                ></textarea>
              </div>
            </div>

            <div className="mt-5 text-end">
              <button
                type="submit"
                className="btn btn-primary btn-lg px-5"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}