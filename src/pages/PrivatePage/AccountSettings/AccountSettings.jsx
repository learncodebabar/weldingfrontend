import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../../api/axios';
import './AccountSettings.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

// React Icons
import {
  FaUserCircle,
  FaEdit,
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaExclamationCircle
} from 'react-icons/fa';

const AccountSettings = () => {
  const navigate = useNavigate();
  
  // State for user data
  const [user, setUser] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    createdAt: '',
    lastLogin: ''
  });

  // State for edit mode
  const [isEditing, setIsEditing] = useState({
    name: false,
    email: false,
    password: false
  });

  // State for form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Get token from localStorage
  const token = localStorage.getItem('adminToken');

  // Fetch user data on component mount
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, []);

  // Fetch user data from API
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await API.get('/admin/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const userData = response.data.user;
      
      setUser({
        id: userData.id || userData._id,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'Admin',
        createdAt: userData.createdAt || new Date().toISOString(),
        lastLogin: userData.lastLogin || new Date().toISOString()
      });

      setFormData(prev => ({
        ...prev,
        name: userData.name,
        email: userData.email
      }));

    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err.response?.data?.message || 'Failed to load user data');
      
      if (err.response?.status === 401) {
        localStorage.removeItem('adminToken');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle edit mode
  const toggleEdit = (field) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    setError('');
    setSuccess('');
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Cancel edit
  const cancelEdit = (field) => {
    setIsEditing(prev => ({
      ...prev,
      [field]: false
    }));
    setFormData(prev => ({
      ...prev,
      name: user.name,
      email: user.email,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    setError('');
    setSuccess('');
  };

  // Update name
  const updateName = async () => {
    if (!formData.name.trim()) {
      setError('Name cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await API.put('/admin/update-profile', 
        { name: formData.name },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUser(prev => ({
        ...prev,
        name: formData.name
      }));

      setSuccess(response.data.message || 'Name updated successfully!');
      setIsEditing(prev => ({ ...prev, name: false }));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating name:', err);
      setError(err.response?.data?.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  // Update email
  const updateEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await API.put('/admin/update-profile', 
        { email: formData.email },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setUser(prev => ({
        ...prev,
        email: formData.email
      }));

      setSuccess(response.data.message || 'Email updated successfully!');
      setIsEditing(prev => ({ ...prev, email: false }));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating email:', err);
      setError(err.response?.data?.message || 'Failed to update email');
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async () => {
    if (!formData.currentPassword) {
      setError('Please enter current password');
      return;
    }

    if (!formData.newPassword) {
      setError('Please enter new password');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await API.put('/admin/change-password', 
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSuccess(response.data.message || 'Password updated successfully!');
      setIsEditing(prev => ({ ...prev, password: false }));
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating password:', err);
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  if (loading && !user.name) {
    return (
      <div className="admin-account-settings-loading">
        <div className="admin-account-settings-loading-spinner"></div>
        <p>Loading account details...</p>
      </div>
    );
  }

  return (
    <div className="admin-account-settings-container  sideber-container-Mobile">
      <Sidebar />
      
      <div className="admin-account-settings-content">
        {/* Header */}
        <div className="admin-account-settings-header">
          <div className="admin-account-settings-header-left">
            <button 
              className="admin-account-settings-back-btn" 
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft /> Back
            </button>
            <h1>Account Settings</h1>
          </div>
          <button 
            className="admin-account-settings-logout-btn" 
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="admin-account-settings-alert admin-account-settings-alert-success">
            <FaCheckCircle />
            <span>{success}</span>
            <button 
              onClick={() => setSuccess('')} 
              className="admin-account-settings-alert-close"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {error && (
          <div className="admin-account-settings-alert admin-account-settings-alert-error">
            <FaExclamationCircle />
            <span>{error}</span>
            <button 
              onClick={() => setError('')} 
              className="admin-account-settings-alert-close"
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="admin-account-settings-profile-card">
          <div className="admin-account-settings-profile-avatar">
            <FaUserCircle />
          </div>
          <div className="admin-account-settings-profile-info">
            <h2>{user.name}</h2>
            <p className="admin-account-settings-profile-email">{user.email}</p>
            <p className="admin-account-settings-profile-role">{user.role}</p>
          </div>
          <div className="admin-account-settings-profile-meta">
            <p>Member since: {formatDate(user.createdAt)}</p>
            <p>Last login: {formatDate(user.lastLogin)}</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="admin-account-settings-sections">
          {/* Name Section */}
          <div className="admin-account-settings-section">
            <div className="admin-account-settings-section-header">
              <h3>Full Name</h3>
              {!isEditing.name ? (
                <button 
                  className="admin-account-settings-edit-btn" 
                  onClick={() => toggleEdit('name')}
                >
                  <FaEdit /> Edit
                </button>
              ) : (
                <div className="admin-account-settings-edit-actions">
                  <button 
                    className="admin-account-settings-save-btn" 
                    onClick={updateName} 
                    disabled={loading}
                  >
                    <FaSave /> Save
                  </button>
                  <button 
                    className="admin-account-settings-cancel-btn" 
                    onClick={() => cancelEdit('name')}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {!isEditing.name ? (
              <div className="admin-account-settings-section-content">
                <p>{user.name}</p>
              </div>
            ) : (
              <div className="admin-account-settings-edit-mode">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  disabled={loading}
                  className="admin-account-settings-edit-input"
                />
              </div>
            )}
          </div>

          {/* Email Section */}
          <div className="admin-account-settings-section">
            <div className="admin-account-settings-section-header">
              <h3>Email Address</h3>
              {!isEditing.email ? (
                <button 
                  className="admin-account-settings-edit-btn" 
                  onClick={() => toggleEdit('email')}
                >
                  <FaEdit /> Edit
                </button>
              ) : (
                <div className="admin-account-settings-edit-actions">
                  <button 
                    className="admin-account-settings-save-btn" 
                    onClick={updateEmail} 
                    disabled={loading}
                  >
                    <FaSave /> Save
                  </button>
                  <button 
                    className="admin-account-settings-cancel-btn" 
                    onClick={() => cancelEdit('email')}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {!isEditing.email ? (
              <div className="admin-account-settings-section-content">
                <p>{user.email}</p>
              </div>
            ) : (
              <div className="admin-account-settings-edit-mode">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  disabled={loading}
                  className="admin-account-settings-edit-input"
                />
              </div>
            )}
          </div>

          {/* Password Section */}
          <div className="admin-account-settings-section">
            <div className="admin-account-settings-section-header">
              <h3>Password</h3>
              {!isEditing.password ? (
                <button 
                  className="admin-account-settings-edit-btn" 
                  onClick={() => toggleEdit('password')}
                >
                  <FaEdit /> Change Password
                </button>
              ) : (
                <div className="admin-account-settings-edit-actions">
                  <button 
                    className="admin-account-settings-save-btn" 
                    onClick={updatePassword} 
                    disabled={loading}
                  >
                    <FaSave /> Update
                  </button>
                  <button 
                    className="admin-account-settings-cancel-btn" 
                    onClick={() => cancelEdit('password')}
                  >
                   Cancel
                  </button>
                </div>
              )}
            </div>
            
            {!isEditing.password ? (
              <div className="admin-account-settings-section-content">
                <p className="admin-account-settings-password-placeholder">••••••••</p>
              </div>
            ) : (
              <div className="admin-account-settings-edit-mode admin-account-settings-password-edit">
                <div className="admin-account-settings-password-field">
                  <label>Current Password</label>
                  <div className="admin-account-settings-password-input-wrapper">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="admin-account-settings-password-toggle"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="admin-account-settings-password-field">
                  <label>New Password</label>
                  <div className="admin-account-settings-password-input-wrapper">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="admin-account-settings-password-toggle"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="admin-account-settings-password-field">
                  <label>Confirm New Password</label>
                  <div className="admin-account-settings-password-input-wrapper">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className="admin-account-settings-password-toggle"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Account Info Section */}
          <div className="admin-account-settings-section admin-account-settings-info-section">
            <div className="admin-account-settings-section-header">
              <h3>Account Information</h3>
            </div>
            <div className="admin-account-settings-info-grid">
              <div className="admin-account-settings-info-item">
                <span className="admin-account-settings-info-label">Account ID</span>
                <span className="admin-account-settings-info-value">{user.id}</span>
              </div>
              <div className="admin-account-settings-info-item">
                <span className="admin-account-settings-info-label">Account Type</span>
                <span className="admin-account-settings-info-value">{user.role}</span>
              </div>
              <div className="admin-account-settings-info-item">
                <span className="admin-account-settings-info-label">Created On</span>
                <span className="admin-account-settings-info-value">{formatDate(user.createdAt)}</span>
              </div>
              <div className="admin-account-settings-info-item">
                <span className="admin-account-settings-info-label">Last Login</span>
                <span className="admin-account-settings-info-value">{formatDate(user.lastLogin)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;