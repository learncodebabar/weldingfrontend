// ThemeSettings.js
import React, { useState, useEffect } from "react";
import "./ThemeSettings.css";
import { useTheme } from "./ThemeContext";
import Sidebar from "../components/Sidebar/Sidebar";

const themes = [
  // Existing 10 themes
  { name: "light", color: "#f8fafc", textColor: "#0f172a" },
  { name: "green", color: "#22c55e", textColor: "#ffffff" },
  { name: "yellow", color: "#facc15", textColor: "#0f172a" },
  { name: "purple", color: "#a855f7", textColor: "#ffffff" },
  { name: "red", color: "#ef4444", textColor: "#ffffff" },
  { name: "orange", color: "#f97316", textColor: "#ffffff" },
  { name: "teal", color: "#14b8a6", textColor: "#ffffff" },
  { name: "pink", color: "#ec4899", textColor: "#ffffff" },
  { name: "indigo", color: "#6366f1", textColor: "#ffffff" },
  
  // New 10 themes - Most Important
  { name: "blue", color: "#3b82f6", textColor: "#ffffff" },
  { name: "sky", color: "#0ea5e9", textColor: "#ffffff" },
  { name: "cyan", color: "#06b6d4", textColor: "#ffffff" },
  { name: "lime", color: "#84cc16", textColor: "#0f172a" },
  { name: "amber", color: "#f59e0b", textColor: "#0f172a" },
  { name: "emerald", color: "#10b981", textColor: "#ffffff" },
  { name: "violet", color: "#8b5cf6", textColor: "#ffffff" },
  { name: "fuchsia", color: "#d946ef", textColor: "#ffffff" },
  { name: "rose", color: "#f43f5e", textColor: "#ffffff" },
  { name: "slate", color: "#64748b", textColor: "#ffffff" },
];

const ThemeSettings = () => {
  const { theme, setTheme } = useTheme();
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(null);

  // Auto hide toast after 5 seconds
  useEffect(() => {
    let timer;
    if (toast.show) {
      timer = setTimeout(() => {
        setToast({ show: false, message: "", type: "" });
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [toast.show]);

  const handleThemeChange = (themeName) => {
    setLoading(themeName);
    
    setTimeout(() => {
      setTheme(themeName);
      setToast({
        show: true,
        message: `Theme changed to ${themeName.toUpperCase()}`,
        type: "success"
      });
      setLoading(null);
    }, 300);
  };

  const handleCloseToast = () => {
    setToast({ show: false, message: "", type: "" });
  };

  return (
    <div className="theme-page">
      <Sidebar />
      <div className="theme-content">
        {/* Toast Message - Exactly like Admin Signup */}
        {toast.show && (
          <div className={`toast-message ${toast.type}`}>
            <div className="toast-content">
              <span className="toast-text">{toast.message}</span>
            </div>
            <button className="toast-close" onClick={handleCloseToast}>✕</button>
          </div>
        )}

        <h2 className="theme-title">
          Theme Settings
          <span className="theme-count">20+ Themes</span>
        </h2>

        <div className="theme-grid">
          {themes.map((t) => (
            <div
              key={t.name}
              className={`theme-card ${theme === t.name ? "active" : ""} ${loading === t.name ? "loading" : ""}`}
              style={{ 
                backgroundColor: t.color,
                color: t.textColor
              }}
              onClick={() => handleThemeChange(t.name)}
            >
              <span className="theme-name">{t.name.toUpperCase()}</span>
              {theme === t.name && (
                <span className="active-badge" style={{ backgroundColor: t.textColor === "#ffffff" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                  ✓
                </span>
              )}
              {loading === t.name && (
                <span className="loading-spinner-small"></span>
              )}
            </div>
          ))}
        </div>

     
      </div>
    </div>
  );
};

export default ThemeSettings;