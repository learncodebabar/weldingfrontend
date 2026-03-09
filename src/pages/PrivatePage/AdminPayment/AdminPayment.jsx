import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX,
  FiFilter, FiCalendar, FiDollarSign, FiSave,
  FiRefreshCw, FiCreditCard, FiFileText
} from 'react-icons/fi';
import {
  BsCurrencyRupee, BsCashStack, BsBank2,
  BsCreditCard2Front, BsThreeDotsVertical
} from 'react-icons/bs';
import Sidebar from '../../../components/Sidebar/Sidebar';
import {
  getAllAdminPayments,
  createAdminPayment,
  updateAdminPayment,
  deleteAdminPayment
} from '../../../api/adminPaymentApi';
import './AdminPayment.css';

const AdminPayment = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filters, setFilters] = useState({
    paymentType: '',
    paymentMethod: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    paymentType: 'business',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: ''
  });

  // Payment types
  const paymentTypes = ['business', 'investment', 'loan', 'miscellaneous'];

  // Payment methods
  const paymentMethods = ['cash', 'bank_transfer', 'cheque', 'online'];

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [searchTerm, payments, filters]);

  // Show toast message
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Fetch all payments
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllAdminPayments({ limit: 1000 });
      
      let paymentsData = [];
      if (response.data?.data) {
        paymentsData = response.data.data;
      } else if (response.data) {
        paymentsData = response.data;
      } else if (Array.isArray(response)) {
        paymentsData = response;
      }
      
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payments');
      showToast('Failed to fetch payments', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter payments based on search and filters
  const filterPayments = () => {
    let filtered = [...payments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(payment => 
        payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.paymentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment._id?.includes(searchTerm)
      );
    }

    // Type filter
    if (filters.paymentType) {
      filtered = filtered.filter(payment => payment.paymentType === filters.paymentType);
    }

    // Method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === filters.paymentMethod);
    }

    // Date range filter
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(payment => new Date(payment.date) >= fromDate);
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(payment => new Date(payment.date) <= toDate);
    }

    setFilteredPayments(filtered);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      if (value === '' || value === '0') {
        setFormData(prev => ({ ...prev, [name]: '' }));
      } else if (!isNaN(value) && parseFloat(value) >= 0) {
        const parts = value.split('.');
        if (parts.length > 1 && parts[1].length > 2) {
          const roundedValue = parseFloat(value).toFixed(2);
          setFormData(prev => ({ ...prev, [name]: roundedValue }));
        } else {
          setFormData(prev => ({ ...prev, [name]: value }));
        }
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      paymentType: '',
      paymentMethod: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  // Open modal for add
  const openAddModal = () => {
    setEditingPayment(null);
    setFormData({
      amount: '',
      paymentType: 'business',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      reference: ''
    });
    setError(null);
    setShowModal(true);
  };

  // Open modal for edit
  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setFormData({
      amount: payment.amount.toString(),
      paymentType: payment.paymentType,
      description: payment.description,
      date: new Date(payment.date).toISOString().split('T')[0],
      paymentMethod: payment.paymentMethod,
      reference: payment.reference || ''
    });
    setError(null);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingPayment(null);
    setError(null);
    setFormData({
      amount: '',
      paymentType: 'business',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      reference: ''
    });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Amount must be greater than 0');
      return false;
    }
    if (!formData.description || !formData.description.trim()) {
      setError('Description is required');
      return false;
    }
    return true;
  };

  // Handle form submit (add/edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const paymentData = {
        amount: parseFloat(parseFloat(formData.amount).toFixed(2)),
        paymentType: formData.paymentType,
        description: formData.description.trim(),
        date: formData.date,
        paymentMethod: formData.paymentMethod,
        reference: formData.reference.trim() || undefined,
        status: 'completed'
      };

      if (editingPayment) {
        // Update existing payment
        const response = await updateAdminPayment(editingPayment._id, paymentData);
        if (response?.success || response?.status === 200) {
          showToast('Payment updated successfully!');
          closeModal();
          fetchPayments();
        } else {
          setError('Failed to update payment');
        }
      } else {
        // Create new payment
        const response = await createAdminPayment(paymentData);
        if (response?.success || response?.status === 201) {
          showToast('Payment added successfully!');
          closeModal();
          fetchPayments();
        } else {
          setError('Failed to add payment');
        }
      }
    } catch (error) {
      console.error('Error saving payment:', error);
      setError(error.response?.data?.message || 'Failed to save payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      setSubmitting(true);
      await deleteAdminPayment(id);
      showToast('Payment deleted successfully!');
      setDeleteConfirm(null);
      fetchPayments();
    } catch (error) {
      console.error('Error deleting payment:', error);
      showToast('Failed to delete payment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toFixed(2).toLocaleString('en-PK')}`;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get payment method icon
  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'cash':
        return <BsCashStack />;
      case 'bank_transfer':
        return <BsBank2 />;
      case 'cheque':
        return <FiFileText />;
      case 'online':
        return <BsCreditCard2Front />;
      default:
        return <BsCurrencyRupee />;
    }
  };

  // Get payment type badge class
  const getPaymentTypeClass = (type) => {
    switch (type) {
      case 'business':
        return 'admin-payment__type-badge--business';
      case 'investment':
        return 'admin-payment__type-badge--investment';
      case 'loan':
        return 'admin-payment__type-badge--loan';
      case 'miscellaneous':
        return 'admin-payment__type-badge--misc';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="admin-payment__container">
        <Sidebar />
        <div className="admin-payment__content admin-payment__content--loading">
          <div className="admin-payment__spinner"></div>
          <h2>Loading Payments...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-payment__container sideber-container-Mobile">
      <Sidebar />
      
      <div className="admin-payment__content">
        {/* Toast Message */}
        {toast.show && (
          <div className={`admin-payment__toast admin-payment__toast--${toast.type}`}>
            <span>{toast.message}</span>
            <button onClick={() => setToast({ show: false })}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="admin-payment__header">
          <div className="admin-payment__header-left">
            <h1 className="admin-payment__title">Admin Payments</h1>
            <p className="admin-payment__subtitle">Manage all manual payment entries</p>
          </div>
          
          <div className="admin-payment__header-right">
            <button 
              className="admin-payment__btn admin-payment__btn--primary"
              onClick={openAddModal}
            >
              <FiPlus /> Add New Payment
            </button>
            <button 
              className="admin-payment__btn admin-payment__btn--refresh"
              onClick={fetchPayments}
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="admin-payment__filters-section">
          <div className="admin-payment__search-wrapper">
            <FiSearch className="admin-payment__search-icon" />
            <input
              type="text"
              placeholder="Search by description, type, reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-payment__search-input"
            />
            {searchTerm && (
              <button 
                className="admin-payment__clear-search"
                onClick={() => setSearchTerm('')}
              >
                <FiX />
              </button>
            )}
          </div>

          <button 
            className={`admin-payment__filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
            {(filters.paymentType || filters.paymentMethod || filters.dateFrom || filters.dateTo) && (
              <span className="admin-payment__filter-badge"></span>
            )}
          </button>

          {(filters.paymentType || filters.paymentMethod || filters.dateFrom || filters.dateTo || searchTerm) && (
            <button 
              className="admin-payment__clear-filters"
              onClick={clearFilters}
            >
              Clear All
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="admin-payment__filter-panel">
            <div className="admin-payment__filter-grid">
              <div className="admin-payment__filter-group">
                <label>Payment Type</label>
                <select
                  name="paymentType"
                  value={filters.paymentType}
                  onChange={handleFilterChange}
                  className="admin-payment__filter-select"
                >
                  <option value="">All Types</option>
                  {paymentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-payment__filter-group">
                <label>Payment Method</label>
                <select
                  name="paymentMethod"
                  value={filters.paymentMethod}
                  onChange={handleFilterChange}
                  className="admin-payment__filter-select"
                >
                  <option value="">All Methods</option>
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>
                      {method.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="admin-payment__filter-group">
                <label>From Date</label>
                <input
                  type="date"
                  name="dateFrom"
                  value={filters.dateFrom}
                  onChange={handleFilterChange}
                  className="admin-payment__filter-input"
                />
              </div>

              <div className="admin-payment__filter-group">
                <label>To Date</label>
                <input
                  type="date"
                  name="dateTo"
                  value={filters.dateTo}
                  onChange={handleFilterChange}
                  className="admin-payment__filter-input"
                />
              </div>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="admin-payment__stats">
          <div className="admin-payment__stat-card">
            <div className="admin-payment__stat-icon">
              <BsCurrencyRupee />
            </div>
            <div className="admin-payment__stat-content">
              <span className="admin-payment__stat-label">Total Payments</span>
              <span className="admin-payment__stat-value">
                {formatCurrency(filteredPayments.reduce((sum, p) => sum + (p.amount || 0), 0))}
              </span>
            </div>
          </div>

          <div className="admin-payment__stat-card">
            <div className="admin-payment__stat-icon">
              <FiCreditCard />
            </div>
            <div className="admin-payment__stat-content">
              <span className="admin-payment__stat-label">Total Count</span>
              <span className="admin-payment__stat-value">
                {filteredPayments.length} Payments
              </span>
            </div>
          </div>
        </div>

        {/* Payments Table */}
        {filteredPayments.length === 0 ? (
          <div className="admin-payment__empty">
            <FiCreditCard className="admin-payment__empty-icon" />
            <h3>No Payments Found</h3>
            <p>{searchTerm || filters.paymentType || filters.paymentMethod ? 'Try clearing your filters' : 'Add your first payment to get started'}</p>
            {(searchTerm || filters.paymentType || filters.paymentMethod || filters.dateFrom || filters.dateTo) && (
              <button onClick={clearFilters} className="admin-payment__empty-btn">
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="admin-payment__table-wrapper">
            <table className="admin-payment__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="admin-payment__table-date">
                      <FiCalendar className="admin-payment__table-icon" />
                      {formatDate(payment.date)}
                    </td>
                    <td>
                      <span className={`admin-payment__type-badge ${getPaymentTypeClass(payment.paymentType)}`}>
                        {payment.paymentType}
                      </span>
                    </td>
                    <td className="admin-payment__table-description">
                      {payment.description}
                    </td>
                    <td className="admin-payment__table-amount">
                      <BsCurrencyRupee className="admin-payment__table-icon" />
                      {formatCurrency(payment.amount)}
                    </td>
                    <td>
                      <span className="admin-payment__method-badge">
                        {getPaymentMethodIcon(payment.paymentMethod)}
                        {payment.paymentMethod.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')}
                      </span>
                    </td>
                    <td className="admin-payment__table-reference">
                      {payment.reference || '-'}
                    </td>
                    <td className="admin-payment__table-actions">
                      <button
                        className="admin-payment__action-btn admin-payment__action-btn--edit"
                        onClick={() => openEditModal(payment)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="admin-payment__action-btn admin-payment__action-btn--delete"
                        onClick={() => setDeleteConfirm(payment._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="admin-payment__modal-overlay">
            <div className="admin-payment__confirm-modal">
              <div className="admin-payment__confirm-header">
                <h3>Confirm Delete</h3>
                <button onClick={() => setDeleteConfirm(null)}>
                  <FiX />
                </button>
              </div>
              <div className="admin-payment__confirm-body">
                <p>Are you sure you want to delete this payment?</p>
                <p className="admin-payment__confirm-warning">This action cannot be undone.</p>
              </div>
              <div className="admin-payment__confirm-footer">
                <button 
                  className="admin-payment__confirm-btn admin-payment__confirm-btn--cancel"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  className="admin-payment__confirm-btn admin-payment__confirm-btn--delete"
                  onClick={() => handleDelete(deleteConfirm)}
                  disabled={submitting}
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Payment Modal */}
        {showModal && (
          <div className="admin-payment__modal-overlay" onClick={closeModal}>
            <div className="admin-payment__modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-payment__modal-header">
                <h2>{editingPayment ? 'Edit Payment' : 'Add New Payment'}</h2>
                <button className="admin-payment__modal-close" onClick={closeModal}>
                  <FiX />
                </button>
              </div>

              {error && (
                <div className="admin-payment__modal-error">
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="admin-payment__form">
                <div className="admin-payment__form-group">
                  <label>Amount (Rs)</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    required
                    min="0"
                    step="0.01"
                    className="admin-payment__form-input"
                  />
                </div>

                <div className="admin-payment__form-group">
                  <label>Payment Type</label>
                  <select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    required
                    className="admin-payment__form-select"
                  >
                    {paymentTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-payment__form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter description"
                    rows="3"
                    required
                    className="admin-payment__form-textarea"
                  />
                </div>

                <div className="admin-payment__form-group">
                  <label>Reference (Optional)</label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="Enter reference number or note"
                    className="admin-payment__form-input"
                  />
                </div>

                <div className="admin-payment__form-row">
                  <div className="admin-payment__form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      className="admin-payment__form-input"
                    />
                  </div>

                  <div className="admin-payment__form-group">
                    <label>Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      required
                      className="admin-payment__form-select"
                    >
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>
                          {method.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="admin-payment__modal-footer">
                  <button 
                    type="button" 
                    className="admin-payment__modal-btn admin-payment__modal-btn--cancel"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-payment__modal-btn admin-payment__modal-btn--submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="admin-payment__spinner-small"></span>
                        {editingPayment ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <FiSave />
                        {editingPayment ? 'Update Payment' : 'Add Payment'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPayment;