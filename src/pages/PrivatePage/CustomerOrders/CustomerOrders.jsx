import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiPackage, FiDollarSign, FiPlus, FiX, FiClock,
  FiCheckCircle, FiAlertCircle, FiShoppingBag, FiUser,
  FiPhone, FiMapPin, FiCalendar, FiCreditCard, FiChevronRight,
  FiTrash2, FiEdit2, FiChevronDown, FiRefreshCw
} from 'react-icons/fi';
import { 
  BsTelephone, BsGeoAlt, BsCurrencyRupee, BsWallet2,
  BsBoxSeam, BsThreeDotsVertical
} from 'react-icons/bs';
import { 
  MdPendingActions, MdOutlineLocalShipping,
  MdOutlineRefresh, MdPayment
} from 'react-icons/md';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { getOrderById, updateOrder } from '../../../api/orderApi';
import { getCustomerById } from '../../../api/customerApi';
import { fetchJobsByCustomer } from '../../../api/jobApi';
import { 
  createExpense,
  getExpensesByOrder,
  updateExpense,
  deleteExpense
} from '../../../api/expenseApi';
import {
  createPayment,
  getPaymentsByOrder,
  updatePayment,
  deletePayment
} from '../../../api/paymentApi';
import './CustomerOrders.css';

const CustomerOrders = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [payments, setPayments] = useState([]);
  
  const [jobsLoading, setJobsLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  
  // Status Dropdown state
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  
  // Modal states
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingPayment, setEditingPayment] = useState(null);
  
  // Expense form state
  const [expenseData, setExpenseData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "material",
    notes: ""
  });
  
  // Payment form state
  const [paymentData, setPaymentData] = useState({
    amount: "",
    paymentMethod: "cash",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  
  const [submitting, setSubmitting] = useState(false);

  // Check if payment is complete
  const isPaymentComplete = order?.remainingBalance <= 0;

  // Calculate totals
  const totalCompletePayment = (order?.advancePayment || 0) + payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const profit = totalCompletePayment - totalExpenses;

  // Status options
  const statusOptions = [
    { value: "pending", label: "Pending", icon: <MdPendingActions />, color: "#f59e0b" },
    { value: "in-progress", label: "In Progress", icon: <MdOutlineLocalShipping />, color: "#3b82f6" },
    { value: "completed", label: "Completed", icon: <FiCheckCircle />, color: "#10b981" }
  ];

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.order-status-dropdown')) {
        setIsStatusDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // جب order آ جائے تو customer ID لے کر jobs fetch کریں
  useEffect(() => {
    if (order?.customer?._id) {
      loadCustomerJobs(order.customer._id);
    } else if (order?.customer) {
      fetchCustomerDetails(order.customer);
    }
    
    // Expenses اور Payments fetch کریں
    if (order?._id) {
      fetchOrderExpenses(order._id);
      fetchOrderPayments(order._id);
    }
  }, [order]);

  // جب customer مل جائے تو jobs fetch کریں
  useEffect(() => {
    if (customer?._id) {
      loadCustomerJobs(customer._id);
    }
  }, [customer]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getOrderById(id);
      console.log("Order details:", response);
      
      let orderData;
      if (response.data && response.data.data) {
        orderData = response.data.data;
      } else if (response.data) {
        orderData = response.data;
      } else {
        orderData = response;
      }
      
      setOrder(orderData);
      
      if (orderData.customer && orderData.customer._id) {
        fetchCustomerDetails(orderData.customer._id);
      } else if (orderData.customer) {
        fetchCustomerDetails(orderData.customer);
      }
      
    } catch (error) {
      console.error("Error fetching order:", error);
      setError(error.response?.data?.message || error.message || "Failed to fetch order");
      showToast("Failed to fetch order details", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await getCustomerById(customerId);
      console.log("Customer details:", response);
      
      let customerData;
      if (response.data && response.data.data) {
        customerData = response.data.data;
      } else if (response.data) {
        customerData = response.data;
      } else {
        customerData = response;
      }
      
      setCustomer(customerData);
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const loadCustomerJobs = async (customerId) => {
    try {
      setJobsLoading(true);
      const response = await fetchJobsByCustomer(customerId);
      console.log("Jobs fetched:", response);
      
      let jobsData;
      if (response.data && response.data.data) {
        jobsData = response.data.data;
      } else if (response.data) {
        jobsData = response.data;
      } else {
        jobsData = response;
      }
      
      setJobs(Array.isArray(jobsData) ? jobsData : []);
      
    } catch (error) {
      console.error("Error fetching jobs:", error);
      showToast("Failed to fetch jobs", "error");
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  // Fetch expenses for this order
  const fetchOrderExpenses = async (orderId, showLoading = true) => {
    try {
      if (showLoading) setExpensesLoading(true);
      
      const response = await getExpensesByOrder(orderId);
      console.log("Expenses fetched:", response);
      
      let expensesData;
      if (response.data && response.data.data) {
        expensesData = response.data.data;
      } else if (response.data) {
        expensesData = response.data;
      } else {
        expensesData = response;
      }
      
      setExpenses(Array.isArray(expensesData) ? expensesData : []);
      
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setExpenses([]);
    } finally {
      if (showLoading) setExpensesLoading(false);
    }
  };

  // Fetch payments for this order
  const fetchOrderPayments = async (orderId, showLoading = true) => {
    try {
      if (showLoading) setPaymentsLoading(true);
      
      const response = await getPaymentsByOrder(orderId);
      console.log("Payments fetched:", response);
      
      let paymentsData;
      if (response.data && response.data.data) {
        paymentsData = response.data.data;
      } else if (response.data) {
        paymentsData = response.data;
      } else {
        paymentsData = response;
      }
      
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]);
    } finally {
      if (showLoading) setPaymentsLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  // Handle Status Change
  const handleStatusChange = async (newStatus) => {
    try {
      setSubmitting(true);
      
      const response = await updateOrder(order._id, { status: newStatus });
      console.log("Status updated:", response.data);
      
      showToast(`Order status updated to ${newStatus}`, "success");
      
      // Refresh order details
      fetchOrderDetails();
      setIsStatusDropdownOpen(false);
      
    } catch (error) {
      console.error("Error updating status:", error);
      showToast(error.response?.data?.message || "Failed to update status", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Add Expense
  const handleAddExpense = async () => {
    if (!expenseData.description.trim()) {
      showToast("Please enter expense description", "error");
      return;
    }

    const amount = parseFloat(expenseData.amount);
    if (!amount || amount <= 0) {
      showToast("Please enter valid amount", "error");
      return;
    }

    try {
      setSubmitting(true);
      
      const expensePayload = {
        order: order._id,
        description: expenseData.description,
        amount: amount,
        date: expenseData.date,
        category: expenseData.category,
        notes: expenseData.notes || ""
      };
      
      const response = await createExpense(expensePayload);
      console.log("Expense added:", response.data);
      
      setShowExpenseModal(false);
      resetExpenseForm();
      
      showToast("Expense added successfully!", "success");
      fetchOrderExpenses(order._id, false);
      
    } catch (error) {
      console.error("Error adding expense:", error);
      showToast(error.response?.data?.message || error.message || "Failed to add expense", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Expense
  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseData({
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split('T')[0],
      category: expense.category || "material",
      notes: expense.notes || ""
    });
    setShowExpenseModal(true);
  };

  // Handle Update Expense
  const handleUpdateExpense = async () => {
    if (!expenseData.description.trim()) {
      showToast("Please enter expense description", "error");
      return;
    }

    const amount = parseFloat(expenseData.amount);
    if (!amount || amount <= 0) {
      showToast("Please enter valid amount", "error");
      return;
    }

    try {
      setSubmitting(true);
      
      const expensePayload = {
        description: expenseData.description,
        amount: amount,
        date: expenseData.date,
        category: expenseData.category,
        notes: expenseData.notes || ""
      };
      
      const response = await updateExpense(editingExpense._id, expensePayload);
      console.log("Expense updated:", response.data);
      
      setShowExpenseModal(false);
      resetExpenseForm();
      
      showToast("Expense updated successfully!", "success");
      fetchOrderExpenses(order._id, false);
      
    } catch (error) {
      console.error("Error updating expense:", error);
      showToast(error.response?.data?.message || error.message || "Failed to update expense", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await deleteExpense(expenseId);
      showToast("Expense deleted successfully!", "success");
      fetchOrderExpenses(order._id, false);
    } catch (error) {
      console.error("Error deleting expense:", error);
      showToast(error.response?.data?.message || error.message || "Failed to delete expense", "error");
    }
  };

  // Handle Add Payment
  const handleAddPayment = async () => {
    const amount = parseFloat(paymentData.amount);
    if (!amount || amount <= 0) {
      showToast("Please enter valid payment amount", "error");
      return;
    }

    if (amount > order?.remainingBalance) {
      showToast(`Payment amount cannot exceed remaining balance (${formatCurrency(order.remainingBalance)})`, "error");
      return;
    }

    try {
      setSubmitting(true);
      
      const paymentPayload = {
        order: order._id,
        amount: amount,
        paymentMethod: paymentData.paymentMethod,
        date: paymentData.date,
        notes: paymentData.notes || ""
      };
      
      const response = await createPayment(paymentPayload);
      console.log("Payment added:", response.data);
      
      setShowPaymentModal(false);
      resetPaymentForm();
      
      showToast("Payment added successfully!", "success");
      
      // Refresh order details and payments
      fetchOrderDetails();
      fetchOrderPayments(order._id, false);
      
    } catch (error) {
      console.error("Error adding payment:", error);
      showToast(error.response?.data?.message || error.message || "Failed to add payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Payment
  const handleEditPayment = (payment) => {
    if (isPaymentComplete) {
      showToast("Cannot edit payment when order is complete", "error");
      return;
    }
    setEditingPayment(payment);
    setPaymentData({
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || "cash",
      date: new Date(payment.date).toISOString().split('T')[0],
      notes: payment.notes || ""
    });
    setShowPaymentModal(true);
  };

  // Handle Update Payment
  const handleUpdatePayment = async () => {
    const amount = parseFloat(paymentData.amount);
    if (!amount || amount <= 0) {
      showToast("Please enter valid payment amount", "error");
      return;
    }

    try {
      setSubmitting(true);
      
      const paymentPayload = {
        amount: amount,
        paymentMethod: paymentData.paymentMethod,
        date: paymentData.date,
        notes: paymentData.notes || ""
      };
      
      const response = await updatePayment(editingPayment._id, paymentPayload);
      console.log("Payment updated:", response.data);
      
      setShowPaymentModal(false);
      resetPaymentForm();
      
      showToast("Payment updated successfully!", "success");
      
      // Refresh order details and payments
      fetchOrderDetails();
      fetchOrderPayments(order._id, false);
      
    } catch (error) {
      console.error("Error updating payment:", error);
      showToast(error.response?.data?.message || error.message || "Failed to update payment", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Payment
  const handleDeletePayment = async (paymentId) => {
    if (isPaymentComplete) {
      showToast("Cannot delete payment when order is complete", "error");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      await deletePayment(paymentId);
      showToast("Payment deleted successfully!", "success");
      
      // Refresh order details and payments
      fetchOrderDetails();
      fetchOrderPayments(order._id, false);
    } catch (error) {
      console.error("Error deleting payment:", error);
      showToast(error.response?.data?.message || error.message || "Failed to delete payment", "error");
    }
  };

  const resetExpenseForm = () => {
    setExpenseData({
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      category: "material",
      notes: ""
    });
    setEditingExpense(null);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: "",
      paymentMethod: "cash",
      date: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setEditingPayment(null);
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Rs 0";
    return `Rs ${Number(amount).toLocaleString('en-PK')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString('en-PK', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <span className="status-badge-customer-orders" style={{ backgroundColor: statusOption.color + '20', color: statusOption.color }}>
        {statusOption.icon}
        {statusOption.label}
      </span>
    );
  };

  const getCategoryColor = (category) => {
    const colors = {
      material: "#3b82f6",
      labor: "#f59e0b",
      transport: "#10b981",
      other: "#8b5cf6",
      miscellaneous: "#6b7280"
    };
    return colors[category] || "#6b7280";
  };

  const calculateWorkTotal = (work) => {
    if (work.total) return work.total;
    if (work.materials && work.materials.length > 0) {
      return work.materials.reduce((sum, material) => sum + (material.total || 0), 0);
    }
    return 0;
  };

  // Format profit with sign
  const formatProfit = (profit) => {
    const formatted = formatCurrency(Math.abs(profit));
    return profit >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  // Get current status
  const currentStatus = statusOptions.find(s => s.value === order?.status) || statusOptions[0];

  // Loading state
  if (loading) {
    return (
      <div className="main-container-customer-orders">
        <Sidebar />
        <div className="content-wrapper-customer-orders loading-container-customer-orders">
          <div className="loading-spinner-customer-orders">
            <FiPackage className="spinner-icon-customer-orders" />
            <h2>Loading Order Details...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="main-container-customer-orders">
        <Sidebar />
        <div className="content-wrapper-customer-orders error-container-customer-orders">
          <div className="error-content-customer-orders">
            <FiAlertCircle className="error-icon-customer-orders" />
            <h2>Error Loading Order</h2>
            <p>{error || "Order not found"}</p>
            <button onClick={() => navigate(-1)} className="refresh-btn-customer-orders">
              <MdOutlineRefresh className="btn-icon-customer-orders" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container-customer-orders  sideber-container-Mobile">
      <Sidebar />
      
      <div className="content-wrapper-customer-orders">
        {/* Toast Message */}
        {toast.show && (
          <div className={`toast-message-customer-orders ${toast.type}`}>
            <div className="toast-content-customer-orders">
              <span className="toast-text-customer-orders">{toast.message}</span>
            </div>
            <button className="toast-close-customer-orders" onClick={() => setToast({ show: false })}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="page-header-customer-orders">
          <div className="header-title-customer-orders">
            <FiShoppingBag className="header-icon-customer-orders" />
            <div>
              <h1>Order Details</h1>
              <p className="order-bill-header">{order.billNumber}</p>
            </div>
          </div>
          <div className="header-actions-customer-orders">
            <button 
              className="action-btn-customer-orders expense-btn"
              onClick={() => {
                resetExpenseForm();
                setShowExpenseModal(true);
              }}
            >
              <FiPlus className="btn-icon-customer-orders" />
              Add Expense
            </button>
            
            {/* Payment Button - Conditional Rendering */}
            {isPaymentComplete ? (
              <div className="payment-complete-badge">
                <FiCheckCircle className="btn-icon-customer-orders" />
                Payment Complete
              </div>
            ) : (
              <button 
                className="action-btn-customer-orders payment-btn"
                onClick={() => {
                  resetPaymentForm();
                  setShowPaymentModal(true);
                }}
              >
                <FiDollarSign className="btn-icon-customer-orders" />
                Add Payment (Remaining: {formatCurrency(order.remainingBalance)})
              </button>
            )}
          </div>
        </div>

        {/* Customer Info Card with Status Dropdown */}
        <div className="customer-info-card-customer-orders">
          <div className="customer-avatar-customer-orders">
            <FiUser />
          </div>
          <div className="customer-details-customer-orders">
            <h2>{customer?.name || order.customer?.name || 'Customer Name'}</h2>
            <div className="customer-contact-customer-orders">
              <p><FiPhone className="info-icon-customer-orders" /> {customer?.phone || order.customer?.phone || 'N/A'}</p>
              <p><FiMapPin className="info-icon-customer-orders" /> {customer?.address || order.customer?.address || 'N/A'}</p>
            </div>
          </div>
          
          {/* Status Dropdown */}
          <div className="order-status-dropdown">
            <div 
              className="status-selector"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              style={{ 
                backgroundColor: currentStatus.color + '20',
                color: currentStatus.color,
                borderColor: currentStatus.color + '40'
              }}
            >
              <span className="status-icon">{currentStatus.icon}</span>
              <span className="status-label">{currentStatus.label}</span>
              <FiChevronDown className={`dropdown-arrow ${isStatusDropdownOpen ? 'open' : ''}`} />
            </div>
            
            {isStatusDropdownOpen && (
              <div className="status-options">
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    className={`status-option ${order.status === option.value ? 'active' : ''}`}
                    onClick={() => handleStatusChange(option.value)}
                    style={{ 
                      backgroundColor: order.status === option.value ? option.color + '20' : 'transparent',
                      color: option.color
                    }}
                  >
                    <span className="status-icon">{option.icon}</span>
                    <span className="status-label">{option.label}</span>
                    {order.status === option.value && <FiCheckCircle className="check-icon" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Cards - با condition */}
        <div className="summary-cards-grid-customer-orders">
          {/* Final Total Card - Always visible */}
          <div className="summary-card-customer-orders total-card">
            <div className="card-icon-customer-orders">
              <FiShoppingBag />
            </div>
            <div className="card-content-customer-orders">
              <span className="card-label-customer-orders">Final Total</span>
              <span className="card-value-customer-orders">{formatCurrency(order.finalTotal)}</span>
            </div>
          </div>

          {/* Conditional Cards based on Payment Complete */}
          {isPaymentComplete ? (
            <>
              {/* Total Complete Payment Card */}
              <div className="summary-card-customer-orders complete-payment-card">
                <div className="card-icon-customer-orders">
                  <FiCheckCircle />
                </div>
                <div className="card-content-customer-orders">
                  <span className="card-label-customer-orders">Total Received</span>
                  <span className="card-value-customer-orders">
                    {formatCurrency(totalCompletePayment)}
                  </span>
                </div>
              </div>

              {/* Total Expenses Card */}
              <div className="summary-card-customer-orders total-expenses-card">
                <div className="card-icon-customer-orders">
                  <FiDollarSign />
                </div>
                <div className="card-content-customer-orders">
                  <span className="card-label-customer-orders">Total Expenses</span>
                  <span className="card-value-customer-orders">
                    {formatCurrency(totalExpenses)}
                  </span>
                </div>
              </div>

              {/* Total Profit Card */}
              <div className="summary-card-customer-orders profit-card">
                <div className="card-icon-customer-orders">
                  <BsCurrencyRupee />
                </div>
                <div className="card-content-customer-orders">
                  <span className="card-label-customer-orders">Net Profit</span>
                  <span className={`card-value-customer-orders ${profit >= 0 ? 'profit-positive' : 'profit-negative'}`}>
                    {formatProfit(profit)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Advance Paid Card */}
              <div className="summary-card-customer-orders advance-card">
                <div className="card-icon-customer-orders">
                  <BsWallet2 />
                </div>
                <div className="card-content-customer-orders">
                  <span className="card-label-customer-orders">Advance Paid</span>
                  <span className="card-value-customer-orders">{formatCurrency(order.advancePayment || 0)}</span>
                </div>
              </div>

              {/* Remaining Balance Card */}
              <div className="summary-card-customer-orders remaining-card">
                <div className="card-icon-customer-orders">
                  <BsCurrencyRupee />
                </div>
                <div className="card-content-customer-orders">
                  <span className="card-label-customer-orders">Remaining</span>
                  <span className="card-value-customer-orders">{formatCurrency(order.remainingBalance || order.finalTotal)}</span>
                </div>
              </div>

              {/* Order Date Card */}
              <div className="summary-card-customer-orders date-card">
                <div className="card-icon-customer-orders">
                  <FiCalendar />
                </div>
                <div className="card-content-customer-orders">
                  <span className="card-label-customer-orders">Order Date</span>
                  <span className="card-value-customer-orders">{formatDate(order.date)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* JOBS SECTION */}
        <div className="jobs-section-customer-orders">
          <div className="section-header-customer-orders">
            <h3>
              <FiPackage className="section-icon" /> Customer Jobs
            </h3>
          </div>

          {jobsLoading ? (
            <div className="jobs-loading-customer-orders">
              <div className="spinner-customer-orders"></div>
              <p>Loading jobs...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="no-jobs-customer-orders">
              <BsBoxSeam className="no-data-icon-customer-orders" />
              <p>No jobs found for this customer</p>
            </div>
          ) : (
            <div className="jobs-grid-customer-orders">
              {jobs.map((job) => (
                <div key={job._id} className="job-card-customer-orders">
                  <div className="job-card-header-customer-orders">
                    <div className="job-title-section-customer-orders">
                      <h4 className="job-bill-customer-orders">{job.billNumber}</h4>
                      <span className="job-date-customer-orders">{formatDate(job.date)}</span>
                    </div>
                    <button 
                      className="view-job-btn-customer-orders"
                      onClick={() => navigate(`/job-details/${job._id}`)}
                    >
                      View <FiChevronRight />
                    </button>
                  </div>

                  <div className="job-works-preview-customer-orders">
                    {job.works?.map((work, idx) => (
                      <div key={idx} className="work-preview-item-customer-orders">
                        <span className="work-name-customer-orders">{work.name}</span>
                        <span className="work-qty-customer-orders">Qty: {work.qty}</span>
                        {work.materials?.length > 0 && (
                          <span className="materials-count-customer-orders">
                            {work.materials.length} materials
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="job-card-footer-customer-orders">
                    <div className="job-total-customer-orders">
                      <span>Total:</span>
                      <strong>{formatCurrency(job.total)}</strong>
                    </div>
                    {job.estimatedAmounts && (
                      <div className="job-estimate-customer-orders">
                        Est: {formatCurrency(job.estimatedAmounts.low)} - {formatCurrency(job.estimatedAmounts.high)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Estimated Amounts Section */}
        {order.estimatedAmounts && (
          <div className="estimates-section-customer-orders">
            <div className="section-header-customer-orders">
              <h3>Estimated Amounts</h3>
            </div>
            <div className="estimates-grid-customer-orders">
              {order.estimatedAmounts.low && (
                <div className="estimate-card-customer-orders low">
                  <span className="estimate-label">Low Estimate</span>
                  <span className="estimate-value">{formatCurrency(order.estimatedAmounts.low)}</span>
                </div>
              )}
              {order.estimatedAmounts.medium && (
                <div className="estimate-card-customer-orders medium">
                  <span className="estimate-label">Medium Estimate</span>
                  <span className="estimate-value">{formatCurrency(order.estimatedAmounts.medium)}</span>
                </div>
              )}
              {order.estimatedAmounts.high && (
                <div className="estimate-card-customer-orders high">
                  <span className="estimate-label">High Estimate</span>
                  <span className="estimate-value">{formatCurrency(order.estimatedAmounts.high)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Works Section */}
        <div className="order-items-section-customer-orders">
          <div className="section-header-customer-orders">
            <h3>Order Works & Materials</h3>
          </div>
          
          {order.works && order.works.length > 0 ? (
            <div className="works-list-customer-orders">
              {order.works.map((work, workIndex) => (
                <div key={workIndex} className="work-card-customer-orders">
                  <div className="work-header-customer-orders">
                    <div className="work-title-customer-orders">
                      <h4>{work.name}</h4>
                      <span className="work-qty-badge-customer-orders">Quantity: {work.qty}</span>
                    </div>
                  </div>
                  
                  {work.materials && work.materials.length > 0 && (
                    <div className="materials-list-customer-orders">
                      <div className="materials-header-customer-orders">
                        <span>Materials Required</span>
                      </div>
                      {work.materials.map((material, materialIndex) => (
                        <div key={materialIndex} className="material-item-customer-orders">
                          <div className="material-info-customer-orders">
                            <span className="material-name-customer-orders">{material.name}</span>
                            <span className="material-details-customer-orders">
                              {material.qty} × Rs {material.rate?.toLocaleString('en-PK')}
                            </span>
                          </div>
                          <div className="material-total-customer-orders">
                            {formatCurrency(material.total || (material.qty * material.rate))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="work-total-customer-orders">
                    <span>Work Total:</span>
                    <span>{formatCurrency(calculateWorkTotal(work))}</span>
                  </div>
                </div>
              ))}
              
              <div className="order-grand-total-customer-orders">
                <span>Grand Total:</span>
                <span>{formatCurrency(order.total || order.finalTotal)}</span>
              </div>
            </div>
          ) : (
            <div className="no-items-customer-orders">
              <p>No works added to this order</p>
            </div>
          )}
        </div>

        {/* EXPENSES SECTION */}
        <div className="expenses-section-customer-orders">
          <div className="section-header-customer-orders">
            <h3>
              <FiDollarSign className="section-icon" /> Expenses
            </h3>
            <span className="expense-count">{expenses.length} items</span>
          </div>
          
          {expensesLoading ? (
            <div className="expenses-loading-customer-orders">
              <div className="spinner-customer-orders"></div>
              <p>Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="no-expenses-customer-orders">
              <FiDollarSign className="no-data-icon-customer-orders" />
              <p>No expenses added yet</p>
              <button 
                className="add-first-btn-customer-orders"
                onClick={() => {
                  resetExpenseForm();
                  setShowExpenseModal(true);
                }}
              >
                <FiPlus /> Add First Expense
              </button>
            </div>
          ) : (
            <div className="expenses-list-customer-orders">
              {expenses.map((expense) => (
                <div key={expense._id} className="expense-card-customer-orders">
                  <div className="expense-card-header">
                    <div className="expense-title">
                      <h4>{expense.description}</h4>
                      <span 
                        className="expense-category"
                        style={{ 
                          backgroundColor: getCategoryColor(expense.category) + '20',
                          color: getCategoryColor(expense.category)
                        }}
                      >
                        {expense.category}
                      </span>
                    </div>
                    <div className="expense-actions">
                      <button 
                        className="edit-btn-customer-orders"
                        onClick={() => handleEditExpense(expense)}
                        title="Edit Expense"
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="delete-btn-customer-orders"
                        onClick={() => handleDeleteExpense(expense._id)}
                        title="Delete Expense"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <div className="expense-card-body">
                    <div className="expense-amount">
                      <BsCurrencyRupee />
                      <span>{formatCurrency(expense.amount)}</span>
                    </div>
                    <div className="expense-date">
                      <FiClock />
                      <span>{formatDate(expense.date)}</span>
                    </div>
                  </div>

                  {expense.notes && (
                    <div className="expense-notes">
                      <p>{expense.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAYMENTS SECTION */}
        <div className="payments-section-customer-orders">
          <div className="section-header-customer-orders">
            <h3>
              <FiCreditCard className="section-icon" /> Payments
            </h3>
            <div className="header-right">
              {isPaymentComplete && (
                <span className="payment-complete-tag">
                  <FiCheckCircle /> Complete
                </span>
              )}
              <span className="payment-count">{payments.length} items</span>
            </div>
          </div>
          
          {paymentsLoading ? (
            <div className="payments-loading-customer-orders">
              <div className="spinner-customer-orders"></div>
              <p>Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="no-payments-customer-orders">
              <FiCreditCard className="no-data-icon-customer-orders" />
              <p>No payments added yet</p>
              {!isPaymentComplete && (
                <button 
                  className="add-first-btn-customer-orders"
                  onClick={() => {
                    resetPaymentForm();
                    setShowPaymentModal(true);
                  }}
                >
                  <FiPlus /> Add First Payment
                </button>
              )}
            </div>
          ) : (
            <div className="payments-list-customer-orders">
              {payments.map((payment) => (
                <div key={payment._id} className="payment-card-customer-orders">
                  <div className="payment-card-header">
                    <div className="payment-title">
                      <span className="payment-method-badge" style={{
                        backgroundColor: payment.paymentMethod === 'cash' ? '#10b98120' : 
                                       payment.paymentMethod === 'card' ? '#3b82f620' : 
                                       payment.paymentMethod === 'bank' ? '#8b5cf620' : '#f59e0b20',
                        color: payment.paymentMethod === 'cash' ? '#10b981' : 
                               payment.paymentMethod === 'card' ? '#3b82f6' : 
                               payment.paymentMethod === 'bank' ? '#8b5cf6' : '#f59e0b'
                      }}>
                        {payment.paymentMethod?.toUpperCase() || 'CASH'}
                      </span>
                    </div>
                    <div className="payment-actions">
                      <button 
                        className="edit-btn-customer-orders"
                        onClick={() => handleEditPayment(payment)}
                        title="Edit Payment"
                        disabled={isPaymentComplete}
                      >
                        <FiEdit2 />
                      </button>
                      <button 
                        className="delete-btn-customer-orders"
                        onClick={() => handleDeletePayment(payment._id)}
                        title="Delete Payment"
                        disabled={isPaymentComplete}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  <div className="payment-card-body">
                    <div className="payment-amount">
                      <BsCurrencyRupee />
                      <span>{formatCurrency(payment.amount)}</span>
                    </div>
                    <div className="payment-date">
                      <FiClock />
                      <span>{formatDate(payment.date)}</span>
                    </div>
                  </div>

                  {payment.notes && (
                    <div className="payment-notes">
                      <p>{payment.notes}</p>
                    </div>
                  )}
                </div>
              ))}
              
              {/* Show completion message if all payments are done */}
              {isPaymentComplete && (
                <div className="payment-complete-message">
                  <FiCheckCircle />
                  <span>All payments completed! Total paid: {formatCurrency(totalCompletePayment)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes Section */}
        {order.notes && (
          <div className="notes-section-customer-orders">
            <div className="section-header-customer-orders">
              <h3>Notes</h3>
            </div>
            <div className="notes-content-customer-orders">
              <p>{order.notes}</p>
            </div>
          </div>
        )}

        {/* Add/Edit Expense Modal */}
        {showExpenseModal && (
          <div className="modal-overlay-customer-orders" onClick={() => {
            setShowExpenseModal(false);
            resetExpenseForm();
          }}>
            <div className="modal-content-customer-orders expense-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-customer-orders">
                <div className="modal-header-title-customer-orders">
                  <FiPackage className="modal-icon-customer-orders" />
                  <h2>{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
                </div>
                <button className="close-modal-customer-orders" onClick={() => {
                  setShowExpenseModal(false);
                  resetExpenseForm();
                }}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body-customer-orders">
                <div className="form-group-customer-orders">
                  <label>
                    <FiPackage className="input-icon-customer-orders" />
                    Description
                  </label>
                  <input
                    type="text"
                    value={expenseData.description}
                    onChange={(e) => setExpenseData({...expenseData, description: e.target.value})}
                    placeholder="Enter expense description"
                    className="form-input-customer-orders"
                  />
                </div>

                <div className="form-group-customer-orders">
                  <label>
                    <BsCurrencyRupee className="input-icon-customer-orders" />
                    Amount (Rs)
                  </label>
                  <input
                    type="number"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData({...expenseData, amount: e.target.value})}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                    className="form-input-customer-orders"
                  />
                </div>

                <div className="form-row-customer-orders">
                  <div className="form-group-customer-orders">
                    <label>
                      <FiCalendar className="input-icon-customer-orders" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={expenseData.date}
                      onChange={(e) => setExpenseData({...expenseData, date: e.target.value})}
                      className="form-input-customer-orders"
                    />
                  </div>

                  <div className="form-group-customer-orders">
                    <label>
                      <FiPackage className="input-icon-customer-orders" />
                      Category
                    </label>
                    <select
                      value={expenseData.category}
                      onChange={(e) => setExpenseData({...expenseData, category: e.target.value})}
                      className="form-select-customer-orders"
                    >
                      <option value="material">Material</option>
                      <option value="labor">Labor</option>
                      <option value="transport">Transport</option>
                      <option value="miscellaneous">Miscellaneous</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-customer-orders">
                  <label>
                    <FiPackage className="input-icon-customer-orders" />
                    Notes (Optional)
                  </label>
                  <textarea
                    value={expenseData.notes}
                    onChange={(e) => setExpenseData({...expenseData, notes: e.target.value})}
                    placeholder="Add any notes"
                    className="form-textarea-customer-orders"
                    rows="2"
                  />
                </div>
              </div>

              <div className="modal-footer-customer-orders">
                <button 
                  className="cancel-btn-customer-orders"
                  onClick={() => {
                    setShowExpenseModal(false);
                    resetExpenseForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  className="submit-btn-customer-orders"
                  onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className="spinning" />
                      {editingExpense ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingExpense ? 'Update Expense' : 'Add Expense'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Payment Modal */}
        {showPaymentModal && (
          <div className="modal-overlay-customer-orders" onClick={() => {
            setShowPaymentModal(false);
            resetPaymentForm();
          }}>
            <div className="modal-content-customer-orders payment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-customer-orders">
                <div className="modal-header-title-customer-orders">
                  <FiCreditCard className="modal-icon-customer-orders" />
                  <h2>{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
                </div>
                <button className="close-modal-customer-orders" onClick={() => {
                  setShowPaymentModal(false);
                  resetPaymentForm();
                }}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body-customer-orders">
                {/* Payment Summary */}
                <div className="payment-summary-info-customer-orders">
                  <div className="info-row-customer-orders">
                    <span>Final Total:</span>
                    <span className="amount-customer-orders">{formatCurrency(order.finalTotal)}</span>
                  </div>
                  <div className="info-row-customer-orders">
                    <span>Advance Paid:</span>
                    <span className="amount-customer-orders advance">{formatCurrency(order.advancePayment || 0)}</span>
                  </div>
                  <div className="info-row-customer-orders">
                    <span>Total Payments:</span>
                    <span className="amount-customer-orders">
                      {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                    </span>
                  </div>
                  <div className="info-row-customer-orders total-row">
                    <span>Remaining Balance:</span>
                    <span className="amount-customer-orders remaining">
                      {formatCurrency(order.remainingBalance || order.finalTotal)}
                    </span>
                  </div>
                  
                  {/* Show max payment amount */}
                  <div className="info-row-customer-orders max-payment-row">
                    <span>Maximum Payment:</span>
                    <span className="amount-customer-orders max-payment">
                      {formatCurrency(order.remainingBalance || order.finalTotal)}
                    </span>
                  </div>
                </div>

                <div className="form-group-customer-orders">
                  <label>
                    <BsCurrencyRupee className="input-icon-customer-orders" />
                    Payment Amount (Rs)
                  </label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    placeholder={`Enter payment amount (Max: ${formatCurrency(order.remainingBalance)})`}
                    min="0"
                    max={order.remainingBalance || order.finalTotal}
                    step="0.01"
                    className="form-input-customer-orders"
                  />
                  <small className="input-hint">
                    Maximum allowed: {formatCurrency(order.remainingBalance || order.finalTotal)}
                  </small>
                </div>

                <div className="form-row-customer-orders">
                  <div className="form-group-customer-orders">
                    <label>
                      <FiCreditCard className="input-icon-customer-orders" />
                      Payment Method
                    </label>
                    <select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                      className="form-select-customer-orders"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="bank">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="form-group-customer-orders">
                    <label>
                      <FiCalendar className="input-icon-customer-orders" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={paymentData.date}
                      onChange={(e) => setPaymentData({...paymentData, date: e.target.value})}
                      className="form-input-customer-orders"
                    />
                  </div>
                </div>

                <div className="form-group-customer-orders">
                  <label>
                    <FiPackage className="input-icon-customer-orders" />
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    placeholder="Add any notes about this payment"
                    className="form-textarea-customer-orders"
                    rows="2"
                  />
                </div>
              </div>

              <div className="modal-footer-customer-orders">
                <button 
                  className="cancel-btn-customer-orders"
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetPaymentForm();
                  }}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  className="submit-btn-customer-orders"
                  onClick={editingPayment ? handleUpdatePayment : handleAddPayment}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <FiRefreshCw className="spinning" />
                      {editingPayment ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    editingPayment ? 'Update Payment' : 'Add Payment'
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

export default CustomerOrders;