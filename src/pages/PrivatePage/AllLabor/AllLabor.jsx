import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import laborService from '../../../api/laborService';
import './AllLabor.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

// React Icons Imports
import { 
  FaUsers, FaUserCheck, FaUserClock, FaWallet, 
  FaSearch, FaTimes, FaHardHat, FaEdit, FaTrash, 
  FaEye, FaExclamationTriangle, FaSyncAlt, FaPhone,
  FaMapMarkerAlt
} from 'react-icons/fa';
import { MdWork } from 'react-icons/md';
import { RiMoneyRupeeCircleFill } from 'react-icons/ri';
import { BsThreeDotsVertical } from 'react-icons/bs';

const AllLabor = () => {
  const navigate = useNavigate();  // ✅ Add navigate hook
  const [labor, setLabor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedLabor, setSelectedLabor] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [laborToDelete, setLaborToDelete] = useState(null);

  useEffect(() => {
    fetchLabor();
  }, []);

  const fetchLabor = async () => {
    try {
      setLoading(true);
      const response = await laborService.getAllLabor();
      setLabor(response.labor || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch labor');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Navigate to worker details page
  const handleViewDetails = (id) => {
    navigate(`/Worker-Details-Page/${id}`);
  };

  // ✅ Navigate to edit page
  const handleEdit = (id) => {
    navigate(`/edit-labor/${id}`);
  };

  const handleDeleteClick = (labor) => {
    setLaborToDelete(labor);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!laborToDelete) return;
    
    try {
      await laborService.deleteLabor(laborToDelete._id);
      setLabor(labor.filter(l => l._id !== laborToDelete._id));
      setShowDeleteModal(false);
      setLaborToDelete(null);
    } catch (err) {
      alert('Failed to delete labor');
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
      await laborService.updateLabor(id, { employmentStatus: newStatus });
      setLabor(labor.map(l => 
        l._id === id ? { ...l, employmentStatus: newStatus } : l
      ));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const filteredLabor = labor.filter(l => {
    if (filter === 'active' && l.employmentStatus !== 'Active') return false;
    if (filter === 'inactive' && l.employmentStatus !== 'Inactive') return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        l.name?.toLowerCase().includes(term) ||
        l.fatherName?.toLowerCase().includes(term) ||
        l.cnic?.includes(term) ||
        l.mobile?.includes(term) ||
        l.city?.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const stats = {
    total: labor.length,
    active: labor.filter(l => l.employmentStatus === 'Active').length,
    inactive: labor.filter(l => l.employmentStatus === 'Inactive').length,
    totalWage: filteredLabor.reduce((sum, l) => sum + (l.perDayRate || 0), 0)
  };

  if (loading) {
    return (
      <div className="all-labor-page">
        <Sidebar />
        <div className="all-labor-content all-labor-loading-state">
          <div className="all-labor-spinner"></div>
          <h2>Loading workforce data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="all-labor-page   sideber-container-Mobile">
      <Sidebar />
      
      <div className="all-labor-content">
        {/* Header */}
        <div className="all-labor-header">
          <div className="all-labor-header-left">
            <h1 className="all-labor-title">Workforce </h1>
            <span className="all-labor-badge">
              <MdWork /> Total Workers: {stats.total}
            </span>
          </div>
          <div className="all-labor-header-right">
            <div className="all-labor-date">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="all-labor-error">
            <FaExclamationTriangle />
            <span>{error}</span>
            <button onClick={fetchLabor} className="all-labor-retry-btn">
              <FaSyncAlt /> Retry
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="all-labor-stats-grid">
          <div className="all-labor-stat-card all-labor-stat-total">
            <div className="all-labor-stat-icon">
              <FaUsers />
            </div>
            <div className="all-labor-stat-info">
              <span className="all-labor-stat-label">Total Workers</span>
              <span className="all-labor-stat-value">{stats.total}</span>
            </div>
          </div>

          <div className="all-labor-stat-card all-labor-stat-active">
            <div className="all-labor-stat-icon">
              <FaUserCheck />
            </div>
            <div className="all-labor-stat-info">
              <span className="all-labor-stat-label">Active</span>
              <span className="all-labor-stat-value">{stats.active}</span>
            </div>
          </div>

          <div className="all-labor-stat-card all-labor-stat-inactive">
            <div className="all-labor-stat-icon">
              <FaUserClock />
            </div>
            <div className="all-labor-stat-info">
              <span className="all-labor-stat-label">Inactive</span>
              <span className="all-labor-stat-value">{stats.inactive}</span>
            </div>
          </div>

          <div className="all-labor-stat-card all-labor-stat-wage">
            <div className="all-labor-stat-icon">
              <RiMoneyRupeeCircleFill />
            </div>
            <div className="all-labor-stat-info">
              <span className="all-labor-stat-label">Daily Wage Pool</span>
              <span className="all-labor-stat-value">Rs. {stats.totalWage.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="all-labor-search-section">
          <div className="all-labor-search-wrapper">
            <FaSearch className="all-labor-search-icon" />
            <input
              type="text"
              className="all-labor-search-input"
              placeholder="Search by name, CNIC, mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="all-labor-clear-search" onClick={() => setSearchTerm('')}>
                <FaTimes />
              </button>
            )}
          </div>

          <div className="all-labor-filter-tabs">
            <button 
              className={`all-labor-filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All <span className="all-labor-filter-count">{stats.total}</span>
            </button>
            <button 
              className={`all-labor-filter-tab ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active <span className="all-labor-filter-count">{stats.active}</span>
            </button>
            <button 
              className={`all-labor-filter-tab ${filter === 'inactive' ? 'active' : ''}`}
              onClick={() => setFilter('inactive')}
            >
              Inactive <span className="all-labor-filter-count">{stats.inactive}</span>
            </button>
          </div>
        </div>

        {/* Labor Table */}
        {filteredLabor.length === 0 ? (
          <div className="all-labor-empty">
            <FaHardHat />
            <h3>No workers found</h3>
            <p>{searchTerm ? 'Try adjusting your search' : 'Add your first worker to get started'}</p>
            {searchTerm && (
              <button className="all-labor-clear-btn" onClick={() => setSearchTerm('')}>
                <FaTimes /> Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="all-labor-table-wrapper">
            <table className="all-labor-table">
              <thead>
                <tr>
                  <th>Worker</th>
                  <th>Contact</th>
                  <th>Per Day Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLabor.map((l, index) => (
                  <tr 
                    key={l._id} 
                    className="all-labor-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleViewDetails(l._id)}  // ✅ Click on row to view details
                  >
                    <td>
                      <div className="all-labor-worker-cell">
                        <span className="all-labor-avatar">
                          {l.name?.charAt(0).toUpperCase()}
                        </span>
                        <div className="all-labor-worker-details">
                          <div className="all-labor-worker-name">{l.name}</div>
                          <small className="all-labor-worker-father">s/o {l.fatherName}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="all-labor-contact-cell">
                        {l.mobile}
                      </div>
                    </td>
                    <td>
                      <span className="all-labor-rate-badge">
                        Rs. {l.perDayRate?.toLocaleString()}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>  {/* ✅ Prevent row click when toggling status */}
                      <button 
                        className={`all-labor-status-btn ${l.employmentStatus?.toLowerCase()}`}
                        onClick={() => handleStatusToggle(l._id, l.employmentStatus)}
                      >
                        <span className="all-labor-status-dot"></span>
                        {l.employmentStatus}
                      </button>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>  {/* ✅ Prevent row click when clicking actions */}
                      <div className="all-labor-actions">
                        <button 
                          className="all-labor-action-btn all-labor-edit" 
                          title="Edit"
                          onClick={() => handleEdit(l._id)}
                        >
                          <FaEdit />
                        </button>
                        {/* <button 
                          className="all-labor-action-btn all-labor-delete" 
                          title="Delete"
                          onClick={() => handleDeleteClick(l)}
                        >
                          <FaTrash />
                        </button> */}
                        <button 
                          className="all-labor-action-btn all-labor-view" 
                          title="View Details"
                          onClick={() => handleViewDetails(l._id)}
                        >
                          <FaEye />
                        </button>
                      
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="all-labor-modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="all-labor-delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="all-labor-modal-header">
                <FaExclamationTriangle className="all-labor-modal-icon" />
                <h2>Confirm Deletion</h2>
                <button className="all-labor-modal-close" onClick={() => setShowDeleteModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="all-labor-modal-body">
                <p>Are you sure you want to delete <strong>{laborToDelete?.name}</strong>?</p>
                <p className="all-labor-warning">This action cannot be undone.</p>
              </div>
              <div className="all-labor-modal-footer">
                <button className="all-labor-cancel-btn" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="all-labor-confirm-delete" onClick={confirmDelete}>
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <button className="all-labor-refresh-btn" onClick={fetchLabor}>
          <FaSyncAlt /> Refresh Data
        </button>
      </div>
    </div>
  );
};

export default AllLabor;