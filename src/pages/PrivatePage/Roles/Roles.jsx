import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import roleService from '../../../api/roleService';
import Sidebar from '../../../components/Sidebar/Sidebar';
import './Roles.css';

// React Icons
import { 
  FaUserPlus, FaTimes, FaEye, FaEdit, FaTrash, 
  FaCheckCircle, FaExclamationCircle, FaSpinner,
  FaUserCircle, FaEnvelope, FaLock, FaCalendarAlt,
  FaShieldAlt, FaSearch, FaUserTag, FaSave
} from 'react-icons/fa';

const Roles = () => {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', 'view'
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  // Form State - Separate variables for better performance
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('manager'); // Default value
  const [status, setStatus] = useState('Active');

  // Toast State
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Field errors
  const [errors, setErrors] = useState({});

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  // Fetch all roles
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAllRoles();
      setRoles(response.roles || []);
    } catch (err) {
      showToast('error', err.message || 'Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  // Fetch single role by ID
  const fetchRoleById = async (roleId) => {
    try {
      setModalLoading(true);
      const response = await roleService.getRoleById(roleId);
      const roleData = response.role;
      
      // Set form data
      setName(roleData.name || '');
      setEmail(roleData.email || '');
      setRole(roleData.role || 'manager');
      setStatus(roleData.status || 'Active');
      setPassword(''); // Don't populate password for security
      setConfirmPassword('');
      
      setSelectedRole(roleData);
    } catch (err) {
      showToast('error', err.message || 'Failed to fetch role details');
    } finally {
      setModalLoading(false);
    }
  };

  // Show toast message
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Reset form
  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setRole('manager');
    setStatus('Active');
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSelectedRole(null);
  };

  // Open modal for adding new role
  const openAddModal = () => {
    resetForm();
    setModalMode('add');
    setShowModal(true);
  };

  // Open modal for viewing role
  const openViewModal = async (roleId) => {
    setModalMode('view');
    setShowModal(true);
    await fetchRoleById(roleId);
  };

  // Open modal for editing role
  const openEditModal = async (roleId) => {
    setModalMode('edit');
    setShowModal(true);
    await fetchRoleById(roleId);
  };

  // Validate form
  const validateForm = (isEditMode) => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 3) {
      newErrors.name = 'Name must be at least 3 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Only validate password for add/edit mode, and only if password is provided
    if (!isEditMode || (isEditMode && password)) {
      if (password && password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (password && !confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password && confirmPassword && password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle create submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm(false)) {
      return;
    }

    try {
      setModalLoading(true);

      const roleData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password,
        role: role
      };

      const response = await roleService.createRole(roleData);

      showToast('success', response.message || 'Role created successfully');
      
      // Refresh roles list
      await fetchRoles();
      
      // Close modal and reset form
      setShowModal(false);
      resetForm();

    } catch (err) {
      showToast('error', err.message || 'Failed to create role');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle update submit
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm(true)) {
      return;
    }

    if (!selectedRole) return;

    try {
      setModalLoading(true);

      const roleData = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role: role,
        status: status
      };

      // Only include password if it's provided
      if (password) {
        roleData.password = password;
      }

      const response = await roleService.updateRole(selectedRole._id, roleData);

      showToast('success', response.message || 'Role updated successfully');
      
      // Refresh roles list
      await fetchRoles();
      
      // Close modal and reset form
      setShowModal(false);
      resetForm();

    } catch (err) {
      showToast('error', err.message || 'Failed to update role');
    } finally {
      setModalLoading(false);
    }
  };

  // Handle view role
  const handleViewRole = (roleId) => {
    openViewModal(roleId);
  };

  // Handle edit role
  const handleEditRole = (roleId) => {
    openEditModal(roleId);
  };

  // Handle delete role
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    try {
      await roleService.deleteRole(roleId);
      showToast('success', 'Role deleted successfully');
      await fetchRoles();
    } catch (err) {
      showToast('error', err.message || 'Failed to delete role');
    }
  };

  // Filter roles based on search
  const filteredRoles = roles.filter(roleItem => {
    const term = searchTerm.toLowerCase();
    return (
      roleItem.name?.toLowerCase().includes(term) ||
      roleItem.email?.toLowerCase().includes(term) ||
      roleItem.role?.toLowerCase().includes(term)
    );
  });

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get modal title based on mode
  const getModalTitle = () => {
    switch(modalMode) {
      case 'add': return 'Add New Role';
      case 'edit': return 'Edit Role';
      case 'view': return 'View Role Details';
      default: return 'Role';
    }
  };

  return (
    <div className="roles-page   sideber-container-Mobile">
      <Sidebar />
      
      <div className="roles-content">
        {/* Toast Message */}
        {toast.show && (
          <div className={`roles-toast ${toast.type}`}>
            <div className="roles-toast-content">
              {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              <span>{toast.message}</span>
            </div>
            <button 
              className="roles-toast-close" 
              onClick={() => setToast({ ...toast, show: false })}
            >
              <FaTimes />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="roles-header">
          <div className="roles-header-left">
            <h1><FaShieldAlt /> Role Management</h1>
            <p>Manage system roles and permissions</p>
          </div>
          <button 
            className="roles-add-btn"
            onClick={openAddModal}
          >
            <FaUserPlus /> Add New Role
          </button>
        </div>

        {/* Search Bar */}
        <div className="roles-search-section">
          <div className="roles-search-wrapper">
            <FaSearch className="roles-search-icon" />
            <input
              type="text"
              className="roles-search-input"
              placeholder="Search by name, email or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="roles-clear-search" 
                onClick={() => setSearchTerm('')}
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="roles-stats-grid">
          <div className="roles-stat-card">
            <div className="roles-stat-icon total">
              <FaUserTag />
            </div>
            <div className="roles-stat-info">
              <span className="roles-stat-label">Total Roles</span>
              <span className="roles-stat-value">{roles.length}</span>
            </div>
          </div>
          <div className="roles-stat-card">
            <div className="roles-stat-icon active">
              <FaShieldAlt />
            </div>
            <div className="roles-stat-info">
              <span className="roles-stat-label">Active Roles</span>
              <span className="roles-stat-value">
                {roles.filter(r => r.status !== 'Inactive').length}
              </span>
            </div>
          </div>
          <div className="roles-stat-card">
            <div className="roles-stat-icon pending">
              <FaCalendarAlt />
            </div>
            <div className="roles-stat-info">
              <span className="roles-stat-label">Created Today</span>
              <span className="roles-stat-value">
                {roles.filter(r => {
                  const today = new Date().toDateString();
                  return new Date(r.createdAt).toDateString() === today;
                }).length}
              </span>
            </div>
          </div>
        </div>

        {/* Roles Table */}
        {loading ? (
          <div className="roles-loading-state">
            <div className="roles-spinner"></div>
            <p>Loading roles...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="roles-empty-state">
            <FaUserCircle size={60} />
            <h3>No roles found</h3>
            <p>
              {searchTerm 
                ? 'Try adjusting your search' 
                : 'Click "Add New Role" to create your first role'}
            </p>
            {searchTerm && (
              <button 
                className="roles-clear-btn" 
                onClick={() => setSearchTerm('')}
              >
                <FaTimes /> Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="roles-table-wrapper">
            <table className="roles-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((roleItem, index) => (
                  <tr key={roleItem._id}>
                    <td>
                      <span className="roles-id-badge">{index + 1}</span>
                    </td>
                    <td>
                      <div className="roles-name-cell">
                        <span className="roles-avatar">
                          {roleItem.name?.charAt(0).toUpperCase()}
                        </span>
                        <span>{roleItem.name}</span>
                      </div>
                    </td>
                    <td>{roleItem.email}</td>
                    <td>
                      <span className={`roles-role-badge ${roleItem.role || 'user'}`}>
                        {roleItem.role || 'User'}
                      </span>
                    </td>
                    <td>
                      <span className={`roles-status-badge ${roleItem.status?.toLowerCase() || 'active'}`}>
                        {roleItem.status || 'Active'}
                      </span>
                    </td>
                    <td>{formatDate(roleItem.createdAt)}</td>
                    <td>
                      <div className="roles-actions">
                        <button 
                          className="roles-action-btn view"
                          onClick={() => handleViewRole(roleItem._id)}
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        <button 
                          className="roles-action-btn edit"
                          onClick={() => handleEditRole(roleItem._id)}
                          title="Edit Role"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="roles-action-btn delete"
                          onClick={() => handleDeleteRole(roleItem._id)}
                          title="Delete Role"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Role Modal - Add/Edit/View */}
        {showModal && (
          <div 
            className="roles-modal-overlay" 
            onClick={() => {
              if (!modalLoading) {
                setShowModal(false);
                resetForm();
              }
            }}
          >
            <div 
              className="roles-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="roles-modal-header">
                <h3>
                  {modalMode === 'add' && <><FaUserPlus /> {getModalTitle()}</>}
                  {modalMode === 'edit' && <><FaEdit /> {getModalTitle()}</>}
                  {modalMode === 'view' && <><FaEye /> {getModalTitle()}</>}
                </h3>
                <button 
                  className="roles-modal-close"
                  onClick={() => {
                    if (!modalLoading) {
                      setShowModal(false);
                      resetForm();
                    }
                  }}
                  disabled={modalLoading}
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={modalMode === 'add' ? handleCreateSubmit : handleUpdateSubmit}>
                <div className="roles-modal-body">
                  {/* Loading State for Modal */}
                  {modalLoading && (
                    <div className="roles-modal-loading">
                      <FaSpinner className="spinning" />
                      <p>Loading...</p>
                    </div>
                  )}

                  {!modalLoading && (
                    <>
                      {/* Name Field */}
                      <div className="roles-form-group">
                        <label>
                          <FaUserCircle /> Full Name 
                          {modalMode !== 'view' && <span className="required">*</span>}
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter full name"
                          disabled={modalLoading || modalMode === 'view'}
                          className={errors.name ? 'error' : ''}
                          readOnly={modalMode === 'view'}
                        />
                        {errors.name && <small className="error-text">{errors.name}</small>}
                      </div>

                      {/* Email Field */}
                      <div className="roles-form-group">
                        <label>
                          <FaEnvelope /> Email Address 
                          {modalMode !== 'view' && <span className="required">*</span>}
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter email address"
                          disabled={modalLoading || modalMode === 'view'}
                          className={errors.email ? 'error' : ''}
                          readOnly={modalMode === 'view'}
                        />
                        {errors.email && <small className="error-text">{errors.email}</small>}
                      </div>

                      {/* Role Type Field */}
                      <div className="roles-form-group">
                        <label>
                          <FaShieldAlt /> Role Type
                          {modalMode !== 'view' && <span className="optional">(Optional)</span>}
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          disabled={modalLoading || modalMode === 'view'}
                          className="roles-select"
                        >
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="user">User</option>
                        </select>
                      </div>

                      {/* Status Field - Only for Edit/View */}
                      {(modalMode === 'edit' || modalMode === 'view') && (
                        <div className="roles-form-group">
                          <label>
                            <FaShieldAlt /> Status
                          </label>
                          {modalMode === 'view' ? (
                            <div className="roles-view-field">
                              <span className={`roles-status-badge ${status?.toLowerCase()}`}>
                                {status}
                              </span>
                            </div>
                          ) : (
                            <select
                              value={status}
                              onChange={(e) => setStatus(e.target.value)}
                              disabled={modalLoading}
                              className="roles-select"
                            >
                              <option value="Active">Active</option>
                              <option value="Inactive">Inactive</option>
                              <option value="Suspended">Suspended</option>
                            </select>
                          )}
                        </div>
                      )}

                      {/* Password Fields - Only for Add/Edit */}
                      {modalMode !== 'view' && (
                        <>
                          {/* Password Field */}
                          <div className="roles-form-group">
                            <label>
                              <FaLock /> Password 
                              {modalMode === 'add' && <span className="required">*</span>}
                              {modalMode === 'edit' && <span className="optional">(Leave blank to keep current)</span>}
                            </label>
                            <div className="roles-password-wrapper">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={modalMode === 'add' ? "Enter password" : "Enter new password (optional)"}
                                disabled={modalLoading}
                                className={errors.password ? 'error' : ''}
                              />
                              <button
                                type="button"
                                className="roles-password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={modalLoading}
                              >
                                {showPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                            {errors.password && <small className="error-text">{errors.password}</small>}
                          </div>

                          {/* Confirm Password Field */}
                          <div className="roles-form-group">
                            <label>
                              <FaLock /> Confirm Password 
                              {(modalMode === 'add' || (modalMode === 'edit' && password)) && <span className="required">*</span>}
                            </label>
                            <div className="roles-password-wrapper">
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm password"
                                disabled={modalLoading}
                                className={errors.confirmPassword ? 'error' : ''}
                              />
                              <button
                                type="button"
                                className="roles-password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                disabled={modalLoading}
                              >
                                {showConfirmPassword ? 'Hide' : 'Show'}
                              </button>
                            </div>
                            {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
                          </div>
                        </>
                      )}

                      {/* View Mode - Display Data */}
                      {modalMode === 'view' && selectedRole && (
                        <div className="roles-view-section">
                          <div className="roles-view-row">
                            <span className="roles-view-label">Role ID:</span>
                            <span className="roles-view-value">{selectedRole._id}</span>
                          </div>
                          <div className="roles-view-row">
                            <span className="roles-view-label">Created At:</span>
                            <span className="roles-view-value">{formatDate(selectedRole.createdAt)}</span>
                          </div>
                          <div className="roles-view-row">
                            <span className="roles-view-label">Last Updated:</span>
                            <span className="roles-view-value">{formatDate(selectedRole.updatedAt)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Modal Footer - Different buttons based on mode */}
                <div className="roles-modal-footer">
                  <button
                    type="button"
                    className="roles-cancel-btn"
                    onClick={() => {
                      if (!modalLoading) {
                        setShowModal(false);
                        resetForm();
                      }
                    }}
                    disabled={modalLoading}
                  >
                    {modalMode === 'view' ? 'Close' : 'Cancel'}
                  </button>
                  
                  {modalMode !== 'view' && (
                    <button
                      type="submit"
                      className="roles-submit-btn"
                      disabled={modalLoading}
                    >
                      {modalLoading ? (
                        <><FaSpinner className="spinning" /> {modalMode === 'add' ? 'Creating...' : 'Updating...'}</>
                      ) : (
                        <>{modalMode === 'add' ? 'Create Role' : 'Update Role'}</>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;