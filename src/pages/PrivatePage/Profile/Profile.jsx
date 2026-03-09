// Profile.jsx (Updated Part)
import React, { useEffect, useState } from "react";
import {
  getProfile,
  createProfile,
  updateProfile,
  deleteProfile,
} from "../../../api/profileApi";
import Sidebar from "../../../components/Sidebar/Sidebar";
import "./Profile.css";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "", visible: false });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    gstNumber: "",
    footerNote: "",
  });

  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  // Auto-hide toast messages
  useEffect(() => {
    if (message.visible) {
      const timer = setTimeout(() => {
        setMessage(prev => ({ ...prev, visible: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message.visible]);

  const showMessage = (type, text) => {
    setMessage({ type, text, visible: true });
  };

  const loadProfile = async () => {
    try {
      const data = await getProfile();
      console.log("Profile data:", data);
      
      if (data) {
        // Handle different response structures
        const profileData = data.data || data;
        setProfile(profileData);
        
        setFormData({
          shopName: profileData.shopName || "",
          ownerName: profileData.ownerName || "",
          phone: profileData.phone || "",
          whatsapp: profileData.whatsapp || "",
          email: profileData.email || "",
          address: profileData.address || "",
          gstNumber: profileData.gstNumber || "",
          footerNote: profileData.footerNote || "",
        });
        
        // Use logoUrl from API response (processed in profileApi.js)
        if (profileData.logoUrl) {
          setLogoPreview(profileData.logoUrl);
        } else if (profileData.logo) {
          // Fallback if logoUrl is not provided
          const baseURL = import.meta.env.VITE_API_URL ;
          const staticBaseURL = baseURL.replace('/api', '');
          setLogoPreview(`${staticBaseURL}/${profileData.logo}`);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      // Don't show error if profile doesn't exist (first time)
      if (error.response?.status !== 404) {
        showMessage("error", "Failed to load profile");
      }
    }
  };

  // Rest of your component remains the same...
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!formData.shopName || !formData.ownerName || !formData.phone || !formData.email) {
      showMessage("error", "Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const form = new FormData();
      
      // Append all form fields
      Object.keys(formData).forEach((key) => {
        if (formData[key]) {
          form.append(key, formData[key]);
        }
      });
      
      // Append logo if selected
      if (logo) {
        form.append("logo", logo);
      }

      let response;
      if (!profile) {
        response = await createProfile(form);
        showMessage("success", "Profile created successfully!");
      } else {
        response = await updateProfile(form);
        showMessage("success", "Profile updated successfully!");
      }

      console.log("Save response:", response);
      await loadProfile(); // Reload profile to get updated data
      
    } catch (error) {
      console.error("Error saving profile:", error);
      showMessage("error", error.response?.data?.message || "Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      await deleteProfile();
      showMessage("success", "Profile deleted successfully!");
      
      // Reset all state
      setProfile(null);
      setFormData({
        shopName: "",
        ownerName: "",
        phone: "",
        whatsapp: "",
        email: "",
        address: "",
        gstNumber: "",
        footerNote: "",
      });
      setLogo(null);
      setLogoPreview(null);
      
    } catch (error) {
      console.error("Error deleting profile:", error);
      showMessage("error", error.response?.data?.message || "Failed to delete profile");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="profile-layout   sideber-container-Mobile">
      <Sidebar />

      <main className="profile-content">
        {/* Toast Message */}
        {message.visible && (
          <div className={`profile-toast-message profile-toast-${message.type}`}>
            <span>{message.text}</span>
            <button
              className="profile-toast-close"
              onClick={() => setMessage(prev => ({ ...prev, visible: false }))}
            >
              ×
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="profile-modal-overlay">
            <div className="profile-modal-container">
              <div className="profile-modal-header">
                <div className="profile-warning-icon">⚠️</div>
                <h3>Delete Profile</h3>
              </div>

              <div className="profile-modal-content">
                <p className="profile-confirmation-question">
                  Are you sure you want to delete <strong>"{formData.shopName}"</strong> profile?
                </p>

                <div className="profile-warning-box">
                  <h4>⚠️ This action cannot be undone!</h4>
                  <p>Deleting your business profile will:</p>
                  <ul>
                    <li>❌ Remove your business information from all invoices</li>
                    <li>❌ Hide your shop name, logo, and contact details from bills</li>
                    <li>❌ Remove GST/NTN number from all future invoices</li>
                    <li>❌ Clear all business settings and preferences</li>
                    <li>📋 Previous invoices will show "No Business Profile"</li>
                  </ul>
                </div>

                <p className="profile-additional-note">
                  <strong>Note:</strong> Your invoice history will remain but without your business details.
                </p>
              </div>

              <div className="profile-modal-actions">
                <button className="profile-cancel-btn" onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button className="profile-delete-btn" onClick={handleConfirmDelete}>
                  Yes, Delete Profile
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="profile-header">
          <h2>Business Profile</h2>
          <p>Manage your business information and settings</p>
        </div>

        <div className="profile-card">
          {/* Logo Section */}
          <div className="profile-logo-section">
            <div className="profile-logo-upload">
              {logoPreview ? (
                <img src={logoPreview} alt="Business Logo" className="profile-logo-preview" />
              ) : (
                <div className="profile-logo-placeholder">
                  <span>{formData.shopName?.charAt(0) || "B"}</span>
                </div>
              )}
              <div className="profile-logo-actions">
                <label htmlFor="logo-input" className="profile-logo-btn profile-upload-btn">
                  {logoPreview ? "Change Logo" : "Upload Logo"}
                </label>
                <input
                  id="logo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                />
                {logoPreview && (
                  <button
                    className="profile-logo-btn profile-remove-btn"
                    onClick={() => {
                      setLogo(null);
                      setLogoPreview(null);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Grid */}
          <div className="profile-form-grid">
            <div className="profile-form-group">
              <label className="profile-required">Shop Name</label>
              <input
                name="shopName"
                placeholder="Enter shop name"
                value={formData.shopName || ""}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-required">Owner Name</label>
              <input
                name="ownerName"
                placeholder="Enter owner name"
                value={formData.ownerName || ""}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-required">Phone</label>
              <input
                name="phone"
                placeholder="Enter phone number"
                value={formData.phone || ""}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="profile-form-group">
              <label>WhatsApp</label>
              <input
                name="whatsapp"
                placeholder="Enter WhatsApp number"
                value={formData.whatsapp || ""}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="profile-form-group profile-full-width">
              <label className="profile-required">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email || ""}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="profile-form-group profile-full-width">
              <label>Address</label>
              <textarea
                name="address"
                placeholder="Enter complete address"
                value={formData.address || ""}
                onChange={handleChange}
                rows="3"
                disabled={loading}
              />
            </div>

            <div className="profile-form-group">
              <label>GST / NTN</label>
              <input
                name="gstNumber"
                placeholder="Enter GST/NTN number"
                value={formData.gstNumber || ""}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="profile-form-group">
              <label>Footer Note</label>
              <textarea
                name="footerNote"
                placeholder="Enter footer note for invoices"
                value={formData.footerNote || ""}
                onChange={handleChange}
                rows="3"
                disabled={loading}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-action-buttons">
            <button
              className={`profile-btn-primary ${loading ? "profile-loading" : ""}`}
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Processing..." : (profile ? "Update Profile" : "Create Profile")}
            </button>

            {profile && (
              <button
                className="profile-btn-delete"
                onClick={handleDeleteClick}
                disabled={loading}
              >
                Delete Profile
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;