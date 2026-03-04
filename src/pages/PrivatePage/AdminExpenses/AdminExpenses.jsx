import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage, FiSearch, FiFilter, FiCalendar,
  FiRefreshCw, FiX, FiDollarSign, FiPlus,
  FiEdit2, FiTrash2, FiSave, FiChevronRight,
  FiClock, FiUser
} from 'react-icons/fi';
import {
  BsCurrencyRupee, BsWallet2, BsBoxSeam,
  BsThreeDotsVertical, BsCashStack
} from 'react-icons/bs';
import {
  MdPendingActions, MdOutlineLocalShipping,
  MdCheckCircle, MdOutlineRefresh
} from 'react-icons/md';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { 
  getAllExpenses, 
  createExpense,
  updateExpense,
  deleteExpense 
} from '../../../api/adminexpenseApi';
import './AdminExpenses.css';

const AdminExpenses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'other',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  });

  // Delete confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Expense categories
  const expenseCategories = [
    'rent', 'utilities', 'salaries', 'marketing', 
    'supplies', 'transport', 'maintenance', 'other'
  ];

  // Payment methods
  const paymentMethods = ['cash', 'bank_transfer', 'cheque', 'online'];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Amount' },
    { value: 'lowest', label: 'Lowest Amount' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    filterAndSortExpenses();
  }, [expenses, searchTerm, categoryFilter, sortBy]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await getAllExpenses({ limit: 1000 });
      
      let expensesData = [];
      if (response?.data) {
        expensesData = response.data;
      } else if (Array.isArray(response)) {
        expensesData = response;
      } else if (response?.expenses) {
        expensesData = response.expenses;
      }
      
      setExpenses(expensesData);
      setFilteredExpenses(expensesData);
      setError(null);
    } catch (error) {
      console.error("Error fetching admin expenses:", error);
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortExpenses = () => {
    let filtered = [...expenses];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(expense => 
        expense.description?.toLowerCase().includes(term) ||
        expense.category?.toLowerCase().includes(term) ||
        expense._id?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        case 'oldest':
          return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt);
        case 'highest':
          return (b.amount || 0) - (a.amount || 0);
        case 'lowest':
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    setFilteredExpenses(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Modal handlers
  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpenseForm({
      amount: '',
      category: 'other',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash'
    });
    setShowExpenseModal(true);
    setError(null);
  };

  const openEditExpenseModal = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      amount: expense.amount,
      category: expense.category || 'other',
      description: expense.description || '',
      date: new Date(expense.date || expense.createdAt).toISOString().split('T')[0],
      paymentMethod: expense.paymentMethod || 'cash'
    });
    setShowExpenseModal(true);
    setError(null);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setEditingExpense(null);
    setError(null);
  };

  // Delete handlers
  const openDeleteModal = (expense) => {
    setExpenseToDelete(expense);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setExpenseToDelete(null);
  };

  // Form change handler
  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    
    // Handle amount field with decimal validation
    if (name === 'amount') {
      if (value === '' || value === '0') {
        setExpenseForm(prev => ({ ...prev, [name]: '' }));
      } else if (!isNaN(value) && parseFloat(value) >= 0) {
        // Limit to 2 decimal places
        const parts = value.split('.');
        if (parts.length > 1 && parts[1].length > 2) {
          const roundedValue = parseFloat(value).toFixed(2);
          setExpenseForm(prev => ({ ...prev, [name]: roundedValue }));
        } else {
          setExpenseForm(prev => ({ ...prev, [name]: value }));
        }
      }
    } else {
      setExpenseForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Validate expense form
  const validateExpenseForm = () => {
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }
    if (!expenseForm.description || !expenseForm.description.trim()) {
      setError("Description is required");
      return false;
    }
    return true;
  };

  // Form submission handler
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateExpenseForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const expenseData = {
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        date: expenseForm.date,
        paymentMethod: expenseForm.paymentMethod,
        status: 'paid'
      };

      let response;
      
      if (editingExpense) {
        // Update existing expense
        response = await updateExpense(editingExpense._id, expenseData);
      } else {
        // Create new expense
        response = await createExpense(expenseData);
      }
      
      if (response?.success || response?.status === 201 || response?.status === 200 || response) {
        closeExpenseModal();
        await fetchExpenses();
        alert(editingExpense ? 'Expense updated successfully!' : 'Expense added successfully!');
      } else {
        setError('Failed to save expense');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      setError(error.response?.data?.message || 'Failed to save expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete expense handler
  const handleDeleteExpense = async () => {
    if (!expenseToDelete) return;
    
    setSubmitting(true);
    
    try {
      await deleteExpense(expenseToDelete._id);
      closeDeleteModal();
      await fetchExpenses();
      alert('Expense deleted successfully!');
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError(error.response?.data?.message || 'Failed to delete expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs ${Number(amount || 0).toLocaleString('en-PK')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      rent: '#3b82f6',
      utilities: '#f59e0b',
      salaries: '#10b981',
      marketing: '#8b5cf6',
      supplies: '#ec4899',
      transport: '#14b8a6',
      maintenance: '#f97316',
      other: '#6b7280'
    };
    return colors[category] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="admin-expenses-container">
        <Sidebar />
        <div className="admin-expenses-content admin-expenses-loading">
          <div className="admin-expenses-spinner"></div>
          <h2>Loading Admin Expenses...</h2>
        </div>
      </div>
    );
  }

  if (error && !showExpenseModal && !showDeleteModal) {
    return (
      <div className="admin-expenses-container">
        <Sidebar />
        <div className="admin-expenses-content admin-expenses-error">
          <FiPackage className="admin-expenses-error-icon" />
          <h2>Error Loading Expenses</h2>
          <p>{error}</p>
          <button onClick={fetchExpenses} className="admin-expenses-refresh-btn">
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-expenses-container  sideber-container-Mobile">
      <Sidebar />
      
      <div className="admin-expenses-content">
        {/* Header */}
        <div className="admin-expenses-header">
          <div className="admin-expenses-header-title">
            <h1>Admin Expenses</h1>
            <p>Manage all your business expenses</p>
          </div>
          
          <div className="admin-expenses-header-actions">
            <button 
              className="admin-expenses-refresh-btn" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? 'admin-expenses-spinning' : ''} />
              Refresh
            </button>
            <button 
              className="admin-expenses-add-btn" 
              onClick={openAddExpenseModal}
            >
              <FiPlus /> Add Expense
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="admin-expenses-stats-grid">
          <div className="admin-expenses-stat-card">
            <div className="admin-expenses-stat-icon">
              <BsCashStack />
            </div>
            <div className="admin-expenses-stat-content">
              <span className="admin-expenses-stat-label">Total Expenses</span>
              <span className="admin-expenses-stat-value">
                {formatCurrency(expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0))}
              </span>
            </div>
          </div>

          <div className="admin-expenses-stat-card">
            <div className="admin-expenses-stat-icon">
              <FiPackage />
            </div>
            <div className="admin-expenses-stat-content">
              <span className="admin-expenses-stat-label">Total Items</span>
              <span className="admin-expenses-stat-value">{expenses.length}</span>
            </div>
          </div>

          <div className="admin-expenses-stat-card">
            <div className="admin-expenses-stat-icon">
              <FiCalendar />
            </div>
            <div className="admin-expenses-stat-content">
              <span className="admin-expenses-stat-label">This Month</span>
              <span className="admin-expenses-stat-value">
                {formatCurrency(expenses.filter(exp => {
                  const expDate = new Date(exp.date || exp.createdAt);
                  const now = new Date();
                  return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
                }).reduce((sum, exp) => sum + (exp.amount || 0), 0))}
              </span>
            </div>
          </div>

          <div className="admin-expenses-stat-card">
            <div className="admin-expenses-stat-icon">
              <BsWallet2 />
            </div>
            <div className="admin-expenses-stat-content">
              <span className="admin-expenses-stat-label">Avg. Expense</span>
              <span className="admin-expenses-stat-value">
                {formatCurrency(expenses.length > 0 
                  ? expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) / expenses.length 
                  : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="admin-expenses-search-filter-bar">
          <div className="admin-expenses-search-wrapper">
            <FiSearch className="admin-expenses-search-icon" />
            <input
              type="text"
              placeholder="Search by description, category or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-expenses-search-input"
            />
            {searchTerm && (
              <button className="admin-expenses-clear-search" onClick={clearSearch}>
                <FiX />
              </button>
            )}
          </div>

          <div className="admin-expenses-filter-wrapper">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-expenses-filter-select"
            >
              <option value="all">All Categories</option>
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="admin-expenses-filter-select"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="admin-expenses-results-info">
          <span>Showing {filteredExpenses.length} of {expenses.length} expenses</span>
        </div>

        {/* Expenses Table */}
        {filteredExpenses.length === 0 ? (
          <div className="admin-expenses-no-data">
            <FiPackage className="admin-expenses-no-data-icon" />
            <h3>No expenses found</h3>
            <p>Try adjusting your search or filter to find what you're looking for.</p>
            <button className="admin-expenses-add-first-btn" onClick={openAddExpenseModal}>
              <FiPlus /> Add First Expense
            </button>
          </div>
        ) : (
          <div className="admin-expenses-table-wrapper">
            <table className="admin-expenses-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id}>
                    <td className="admin-expenses-date">
                      <FiCalendar />
                      {formatDate(expense.date || expense.createdAt)}
                    </td>
                    <td className="admin-expenses-description">
                      <div className="admin-expenses-description-text">{expense.description || 'N/A'}</div>
                      {expense.notes && <small className="admin-expenses-notes">{expense.notes}</small>}
                    </td>
                    <td>
                      <span 
                        className="admin-expenses-category-badge"
                        style={{ 
                          backgroundColor: getCategoryColor(expense.category) + '20',
                          color: getCategoryColor(expense.category),
                          borderColor: getCategoryColor(expense.category) + '40'
                        }}
                      >
                        {expense.category || 'other'}
                      </span>
                    </td>
                    <td className="admin-expenses-amount">{formatCurrency(expense.amount)}</td>
                    <td className="admin-expenses-payment-method">
                      <span className="admin-expenses-payment-badge">
                        {expense.paymentMethod || 'cash'}
                      </span>
                    </td>
                    <td className="admin-expenses-actions">
                      <button 
                        className="admin-expenses-edit-btn"
                        onClick={() => openEditExpenseModal(expense)}
                        title="Edit Expense"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="admin-expenses-delete-btn"
                        onClick={() => openDeleteModal(expense)}
                        title="Delete Expense"
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

        {/* Add/Edit Expense Modal */}
        {showExpenseModal && (
          <div className="admin-expenses-modal-overlay">
            <div className="admin-expenses-modal">
              <div className="admin-expenses-modal-header">
                <h2 className="admin-expenses-modal-title">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h2>
                <button className="admin-expenses-modal-close" onClick={closeExpenseModal}>
                  <FiX />
                </button>
              </div>
              
              {error && (
                <div className="admin-expenses-modal-error">
                  <p>{error}</p>
                </div>
              )}
              
              <form onSubmit={handleExpenseSubmit} className="admin-expenses-form">
                <div className="admin-expenses-form-group">
                  <label className="admin-expenses-form-label">Amount (Rs)</label>
                  <input
                    type="number"
                    name="amount"
                    value={expenseForm.amount}
                    onChange={handleExpenseChange}
                    placeholder="Enter amount"
                    required
                    min="0"
                    step="0.01"
                    className="admin-expenses-form-input"
                  />
                </div>

                <div className="admin-expenses-form-group">
                  <label className="admin-expenses-form-label">Category</label>
                  <select
                    name="category"
                    value={expenseForm.category}
                    onChange={handleExpenseChange}
                    required
                    className="admin-expenses-form-select"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-expenses-form-group">
                  <label className="admin-expenses-form-label">Description</label>
                  <textarea
                    name="description"
                    value={expenseForm.description}
                    onChange={handleExpenseChange}
                    placeholder="Enter description"
                    rows="3"
                    required
                    className="admin-expenses-form-textarea"
                  />
                </div>

                <div className="admin-expenses-form-row">
                  <div className="admin-expenses-form-group">
                    <label className="admin-expenses-form-label">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={expenseForm.date}
                      onChange={handleExpenseChange}
                      required
                      className="admin-expenses-form-input"
                    />
                  </div>

                  <div className="admin-expenses-form-group">
                    <label className="admin-expenses-form-label">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={expenseForm.paymentMethod}
                      onChange={handleExpenseChange}
                      required
                      className="admin-expenses-form-select"
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

                <div className="admin-expenses-modal-footer">
                  <button 
                    type="button" 
                    className="admin-expenses-modal-btn admin-expenses-modal-btn--cancel" 
                    onClick={closeExpenseModal}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="admin-expenses-modal-btn admin-expenses-modal-btn--submit" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="admin-expenses-spinner admin-expenses-spinner--small"></span>
                        {editingExpense ? 'Updating...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        {editingExpense ? 'Update Expense' : 'Add Expense'}
                        <FiSave />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && expenseToDelete && (
          <div className="admin-expenses-modal-overlay">
            <div className="admin-expenses-modal admin-expenses-modal--small">
              <div className="admin-expenses-modal-header">
                <h2 className="admin-expenses-modal-title">Delete Expense</h2>
                <button className="admin-expenses-modal-close" onClick={closeDeleteModal}>
                  <FiX />
                </button>
              </div>
              
              <div className="admin-expenses-modal-body">
                <p className="admin-expenses-delete-message">
                  Are you sure you want to delete this expense?
                </p>
                <div className="admin-expenses-delete-preview">
                  <p><strong>Description:</strong> {expenseToDelete.description}</p>
                  <p><strong>Amount:</strong> {formatCurrency(expenseToDelete.amount)}</p>
                  <p><strong>Date:</strong> {formatDate(expenseToDelete.date || expenseToDelete.createdAt)}</p>
                </div>
              </div>
              
              <div className="admin-expenses-modal-footer">
                <button 
                  type="button" 
                  className="admin-expenses-modal-btn admin-expenses-modal-btn--cancel" 
                  onClick={closeDeleteModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="admin-expenses-modal-btn admin-expenses-modal-btn--delete" 
                  onClick={handleDeleteExpense}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="admin-expenses-spinner admin-expenses-spinner--small"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      Delete Expense
                      <FiTrash2 />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExpenses;