import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiDollarSign, FiPackage, FiTrendingUp, FiUsers,
  FiCalendar, FiFilter, FiDownload, FiRefreshCw,
  FiPlusCircle, FiX, FiSave, FiCreditCard
} from 'react-icons/fi';
import {
  BsCurrencyRupee, BsBoxSeam, BsGraphUp, BsPeople,
  BsTruck, BsWallet2, BsCashStack
} from 'react-icons/bs';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { getAllOrders } from '../../../api/orderApi';
import { getAllExpenses as getCustomerExpenses } from '../../../api/expenseApi';
import { getAllExpenses as getAdminExpenses, createExpense as createAdminExpense } from '../../../api/adminexpenseApi';
import { getAllCustomers } from '../../../api/customerApi';
import { getAllJobs } from '../../../api/jobApi';
import { getAllPayments } from '../../../api/paymentApi';
import { getAllAdminPayments, createAdminPayment } from '../../../api/adminPaymentApi';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  
  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'other',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  });

  // Admin Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentType: 'business',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: ''
  });

  // Data states
  const [orders, setOrders] = useState([]);
  const [customerExpenses, setCustomerExpenses] = useState([]);
  const [adminExpenses, setAdminExpenses] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  
  // Summary stats - Simplified
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalJobs: 0
  });

  // Chart data
  const [monthlyData, setMonthlyData] = useState([]);
  const [revenueExpenseData, setRevenueExpenseData] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  // Colors for charts
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Expense categories
  const expenseCategories = [
    'rent', 'utilities', 'salaries', 'marketing', 
    'supplies', 'transport', 'maintenance', 'other'
  ];

  // Payment methods
  const paymentMethods = ['cash', 'bank_transfer', 'cheque', 'online'];
  
  // Admin Payment types
  const adminPaymentTypes = ['business', 'investment', 'loan', 'miscellaneous'];

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  // Format currency with 2 decimal places
  const formatCurrency = (amount) => {
    const numAmount = Number(amount || 0);
    return `Rs ${numAmount.toFixed(2).toLocaleString('en-PK')}`;
  };

  // Format number with commas
  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString('en-PK');
  };

  // Round to 2 decimal places
  const roundToTwoDecimals = (value) => {
    return Number((value).toFixed(2));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ordersRes, customerExpensesRes, adminExpensesRes, customersRes, jobsRes, paymentsRes, adminPaymentsRes] = await Promise.all([
        getAllOrders(),
        getCustomerExpenses({ limit: 1000 }),
        getAdminExpenses({ limit: 1000 }),
        getAllCustomers(),
        getAllJobs(),
        getAllPayments(),
        getAllAdminPayments({ limit: 1000 })
      ]);

      // Set orders
      const ordersData = ordersRes.data?.data || ordersRes.data || ordersRes || [];
      setOrders(ordersData);

      // Set customer expenses
      let customerExpensesData = [];
      if (customerExpensesRes?.data?.data) {
        customerExpensesData = customerExpensesRes.data.data;
      } else if (customerExpensesRes?.data) {
        customerExpensesData = customerExpensesRes.data;
      } else if (Array.isArray(customerExpensesRes)) {
        customerExpensesData = customerExpensesRes;
      }
      setCustomerExpenses(customerExpensesData);

      // Set admin expenses
      let adminExpensesData = [];
      if (adminExpensesRes?.data?.data) {
        adminExpensesData = adminExpensesRes.data.data;
      } else if (adminExpensesRes?.data) {
        adminExpensesData = adminExpensesRes.data;
      } else if (Array.isArray(adminExpensesRes)) {
        adminExpensesData = adminExpensesRes;
      }
      setAdminExpenses(adminExpensesData);

      // Set admin payments
      let adminPaymentsData = [];
      if (adminPaymentsRes?.data?.data) {
        adminPaymentsData = adminPaymentsRes.data.data;
      } else if (adminPaymentsRes?.data) {
        adminPaymentsData = adminPaymentsRes.data;
      } else if (Array.isArray(adminPaymentsRes)) {
        adminPaymentsData = adminPaymentsRes;
      }
      setAdminPayments(adminPaymentsData);

      // Combine both expense types
      const allExpenses = [...customerExpensesData, ...adminExpensesData];

      // Set other data
      const customersData = customersRes.data?.data || customersRes.data || customersRes || [];
      setCustomers(customersData);

      const jobsData = jobsRes.data?.data || jobsRes.data || jobsRes || [];
      setJobs(jobsData);

      const paymentsData = paymentsRes.data?.data || paymentsRes.data || paymentsRes || [];
      setPayments(paymentsData);

      // Calculate summaries - simplified
      const newSummary = calculateSummaries(ordersData, allExpenses, customersData, jobsData, paymentsData, adminPaymentsData);
      
      // Set summary first
      setSummary(newSummary);
      
      // Then prepare chart data with the new summary values
      const chartData = prepareChartData(ordersData, allExpenses, paymentsData, customerExpensesData, adminExpensesData, adminPaymentsData, newSummary);
      
      // Set all chart data
      setMonthlyData(chartData.monthlyData);
      setRevenueExpenseData(chartData.revenueExpenseData);
      setStatusData(chartData.statusData);
      setCategoryData(chartData.categoryData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateSummaries = (ordersData, allExpenses, customersData, jobsData, paymentsData, adminPaymentsData) => {
    const filteredOrders = filterByDateRange(ordersData);
    const filteredAllExpenses = filterByDateRange(allExpenses);
    const filteredPayments = filterByDateRange(paymentsData);
    const filteredAdminPayments = filterByDateRange(adminPaymentsData);
    
    // Revenue from orders (advance payments) - round to 2 decimals
    const totalAdvance = filteredOrders.reduce((sum, order) => {
      const amount = order.advancePayment || 0;
      return sum + roundToTwoDecimals(amount);
    }, 0);
    
    // Revenue from customer payments - round to 2 decimals
    const totalPaymentsAmount = filteredPayments.reduce((sum, payment) => {
      const amount = payment.amount || 0;
      return sum + roundToTwoDecimals(amount);
    }, 0);
    
    // Revenue from admin manual payments - round to 2 decimals
    const totalAdminPaymentsAmount = filteredAdminPayments.reduce((sum, payment) => {
      const amount = payment.amount || 0;
      return sum + roundToTwoDecimals(amount);
    }, 0);
    
    // Total revenue = all sources combined - round to 2 decimals
    const totalRevenue = roundToTwoDecimals(totalAdvance + totalPaymentsAmount + totalAdminPaymentsAmount);
    
    // Total expenses - round to 2 decimals
    const totalExpenses = roundToTwoDecimals(filteredAllExpenses.reduce((sum, expense) => {
      const amount = expense.amount || 0;
      return sum + roundToTwoDecimals(amount);
    }, 0));

    return {
      totalRevenue,
      totalExpenses,
      totalProfit: roundToTwoDecimals(totalRevenue - totalExpenses),
      totalOrders: filteredOrders.length,
      totalCustomers: customersData.length,
      totalJobs: jobsData.length
    };
  };

  const filterByDateRange = (data) => {
    if (!data || !Array.isArray(data)) return [];
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    end.setHours(23, 59, 59, 999);

    return data.filter(item => {
      if (!item) return false;
      const itemDate = new Date(item.date || item.createdAt || Date.now());
      return itemDate >= start && itemDate <= end;
    });
  };

  const prepareChartData = (ordersData, allExpenses, paymentsData, customerExpensesData, adminExpensesData, adminPaymentsData, currentSummary) => {
    const monthly = {};
    const last6Months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      monthly[monthKey] = {
        name: monthName,
        revenue: 0,
        expenses: 0,
        profit: 0
      };
      last6Months.push(monthKey);
    }

    // Calculate revenue from orders (advance payments)
    if (Array.isArray(ordersData)) {
      ordersData.forEach(order => {
        if (!order) return;
        const date = new Date(order.date || order.createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthly[monthKey]) {
          monthly[monthKey].revenue += roundToTwoDecimals(order.advancePayment || 0);
        }
      });
    }

    // Calculate revenue from customer payments
    if (Array.isArray(paymentsData)) {
      paymentsData.forEach(payment => {
        if (!payment) return;
        const date = new Date(payment.date || payment.createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthly[monthKey]) {
          monthly[monthKey].revenue += roundToTwoDecimals(payment.amount || 0);
        }
      });
    }

    // Calculate revenue from admin manual payments
    if (Array.isArray(adminPaymentsData)) {
      adminPaymentsData.forEach(payment => {
        if (!payment) return;
        const date = new Date(payment.date || payment.createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthly[monthKey]) {
          monthly[monthKey].revenue += roundToTwoDecimals(payment.amount || 0);
        }
      });
    }

    // Calculate expenses
    if (Array.isArray(allExpenses)) {
      allExpenses.forEach(expense => {
        if (!expense) return;
        const date = new Date(expense.date || expense.createdAt || Date.now());
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthly[monthKey]) {
          monthly[monthKey].expenses += roundToTwoDecimals(expense.amount || 0);
        }
      });
    }

    // Calculate profit for each month
    Object.keys(monthly).forEach(key => {
      monthly[key].profit = roundToTwoDecimals(monthly[key].revenue - monthly[key].expenses);
    });

    const monthlyDataResult = last6Months.map(month => monthly[month] || { 
      name: month, 
      revenue: 0, 
      expenses: 0, 
      profit: 0 
    });

    // Create revenue/expense data using the current summary values
    const revenueExpenseDataResult = [
      { name: 'Revenue', amount: currentSummary.totalRevenue, color: '#2563eb' },
      { name: 'Expenses', amount: currentSummary.totalExpenses, color: '#f59e0b' },
      { name: 'Profit', amount: currentSummary.totalProfit, color: '#10b981' }
    ];

    const statusCount = {
      pending: Array.isArray(ordersData) ? ordersData.filter(o => o?.status === 'pending').length : 0,
      'in-progress': Array.isArray(ordersData) ? ordersData.filter(o => o?.status === 'in-progress').length : 0,
      completed: Array.isArray(ordersData) ? ordersData.filter(o => o?.status === 'completed').length : 0
    };

    const statusDataResult = [
      { name: 'Pending', value: statusCount.pending, color: '#f59e0b' },
      { name: 'In Progress', value: statusCount['in-progress'], color: '#3b82f6' },
      { name: 'Completed', value: statusCount.completed, color: '#10b981' }
    ].filter(item => item.value > 0);

    // Expense categories
    const categoryExpenses = {};
    
    if (Array.isArray(allExpenses)) {
      allExpenses.forEach(expense => {
        if (!expense) return;
        const cat = expense.category || 'other';
        categoryExpenses[cat] = roundToTwoDecimals((categoryExpenses[cat] || 0) + (expense.amount || 0));
      });
    }

    const categoryDataResult = Object.keys(categoryExpenses).map((key, index) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: categoryExpenses[key],
      color: COLORS[index % COLORS.length]
    }));

    return {
      monthlyData: monthlyDataResult,
      revenueExpenseData: revenueExpenseDataResult,
      statusData: statusDataResult,
      categoryData: categoryDataResult
    };
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Expense Modal handlers
  const openExpenseModal = () => {
    setShowExpenseModal(true);
    setExpenseForm({
      amount: '',
      category: 'other',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash'
    });
    setError(null);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setError(null);
  };

  // Payment Modal handlers
  const openPaymentModal = () => {
    setShowPaymentModal(true);
    setPaymentForm({
      amount: '',
      paymentType: 'business',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      reference: ''
    });
    setError(null);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setError(null);
  };

  // Form change handlers
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

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    
    // Handle amount field with decimal validation
    if (name === 'amount') {
      if (value === '' || value === '0') {
        setPaymentForm(prev => ({ ...prev, [name]: '' }));
      } else if (!isNaN(value) && parseFloat(value) >= 0) {
        // Limit to 2 decimal places
        const parts = value.split('.');
        if (parts.length > 1 && parts[1].length > 2) {
          const roundedValue = parseFloat(value).toFixed(2);
          setPaymentForm(prev => ({ ...prev, [name]: roundedValue }));
        } else {
          setPaymentForm(prev => ({ ...prev, [name]: value }));
        }
      }
    } else {
      setPaymentForm(prev => ({ ...prev, [name]: value }));
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

  // Validate payment form
  const validatePaymentForm = () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      setError("Amount must be greater than 0");
      return false;
    }
    if (!paymentForm.description || !paymentForm.description.trim()) {
      setError("Description is required");
      return false;
    }
    return true;
  };

  // Expense form submission
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateExpenseForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const expenseData = {
        amount: roundToTwoDecimals(parseFloat(expenseForm.amount)),
        category: expenseForm.category,
        description: expenseForm.description.trim(),
        date: expenseForm.date,
        paymentMethod: expenseForm.paymentMethod,
        status: 'paid'
      };

      const response = await createAdminExpense(expenseData);
      
      if (response?.success || response?.status === 201 || response?.status === 200) {
        closeExpenseModal();
        await fetchDashboardData();
        alert('Admin expense added successfully!');
      } else {
        setError('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      setError(error.response?.data?.message || 'Failed to add expense. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Payment form submission
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const paymentData = {
        amount: roundToTwoDecimals(parseFloat(paymentForm.amount)),
        paymentType: paymentForm.paymentType,
        description: paymentForm.description.trim(),
        date: paymentForm.date,
        paymentMethod: paymentForm.paymentMethod,
        reference: paymentForm.reference.trim() || undefined,
        status: 'completed'
      };

      const response = await createAdminPayment(paymentData);
      
      if (response?.success || response?.status === 201 || response?.status === 200) {
        closePaymentModal();
        await fetchDashboardData();
        alert('Admin payment added successfully!');
      } else {
        setError('Failed to add payment');
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      setError(error.response?.data?.message || 'Failed to add payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Manual refresh function
  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="dashboard__container">
        <Sidebar />
        <div className="dashboard__content dashboard__content--loading">
          <div className="dashboard__spinner"></div>
          <h2 className="dashboard__loading-text">Loading Dashboard...</h2>
        </div>
      </div>
    );
  }

  if (error && !showExpenseModal && !showPaymentModal) {
    return (
      <div className="dashboard__container">
        <Sidebar />
        <div className="dashboard__content dashboard__content--error">
          <FiPackage className="dashboard__error-icon" />
          <h2 className="dashboard__error-title">Error Loading Dashboard</h2>
          <p className="dashboard__error-message">{error}</p>
          <button onClick={handleRefresh} className="dashboard__refresh-btn">
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard__container sideber-container-Mobile">
      <Sidebar />
      
      <div className="dashboard__content">
        {/* Header with Title and Action Buttons */}
        <div className="dashboard__header">
          <div className="dashboard__header-left">
            <h1 className="dashboard__title"> Dashboard</h1>
            {/* <p className="dashboard__subtitle">Welcome back, Admin</p> */}
          </div>
          
          <div className="dashboard__header-right">
            <div className="dashboard__actions">
              <button 
                className="dashboard__btn dashboard__btn--expense" 
                onClick={openExpenseModal}
              >
                <FiPlusCircle className="dashboard__btn-icon" />
                Add Expense
              </button>
              <button 
                className="dashboard__btn dashboard__btn--payment" 
                onClick={openPaymentModal}
              >
                <FiCreditCard className="dashboard__btn-icon" />
                Add Payment
              </button>
           
            </div>
            
            <div className="dashboard__date-range">
              <div className="dashboard__date-input">
                <FiCalendar className="dashboard__date-icon" />
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="dashboard__date-field"
                />
              </div>
              <span className="dashboard__date-separator">to</span>
              <div className="dashboard__date-input">
                <FiCalendar className="dashboard__date-icon" />
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="dashboard__date-field"
                />
              </div>
              <button className="dashboard__filter-btn" onClick={handleRefresh}>
                <FiFilter /> Apply Filter
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards - Simplified */}
        <div className="dashboard__stats-grid">
          {/* Total Revenue Card */}
          <div className="dashboard__stat-card dashboard__stat-card--revenue">
            <div className="dashboard__stat-icon">
              <BsCurrencyRupee />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Total Revenue</span>
              <span className="dashboard__stat-value">{formatCurrency(summary.totalRevenue)}</span>
            </div>
          </div>

          {/* Total Expenses Card */}
          <div className="dashboard__stat-card dashboard__stat-card--expenses">
            <div className="dashboard__stat-icon">
              <BsWallet2 />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Total Expenses</span>
              <span className="dashboard__stat-value">{formatCurrency(summary.totalExpenses)}</span>
            </div>
          </div>

          {/* Net Profit Card */}
          <div className="dashboard__stat-card dashboard__stat-card--profit">
            <div className="dashboard__stat-icon">
              <FiDollarSign />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Net Profit</span>
              <span className="dashboard__stat-value">{formatCurrency(summary.totalProfit)}</span>
              <span className={`dashboard__stat-trend ${summary.totalProfit >= 0 ? 'dashboard__stat-trend--positive' : 'dashboard__stat-trend--negative'}`}>
                {summary.totalProfit >= 0 ? '▲ Profit' : '▼ Loss'}
              </span>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="dashboard__stat-card dashboard__stat-card--orders">
            <div className="dashboard__stat-icon">
              <FiPackage />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Total Orders</span>
              <span className="dashboard__stat-value">{formatNumber(summary.totalOrders)}</span>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="dashboard__stats-row">
          <div className="dashboard__stat-card dashboard__stat-card--small">
            <div className="dashboard__stat-icon">
              <BsPeople />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Total Customers</span>
              <span className="dashboard__stat-value">{formatNumber(summary.totalCustomers)}</span>
            </div>
          </div>

          <div className="dashboard__stat-card dashboard__stat-card--small">
            <div className="dashboard__stat-icon">
              <BsBoxSeam />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Total Jobs</span>
              <span className="dashboard__stat-value">{formatNumber(summary.totalJobs)}</span>
            </div>
          </div>

          <div className="dashboard__stat-card dashboard__stat-card--small">
            <div className="dashboard__stat-icon">
              <BsTruck />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Active Projects</span>
              <span className="dashboard__stat-value">{formatNumber(orders.filter(o => o.status === 'pending' || o.status === 'in-progress').length)}</span>
            </div>
          </div>

          <div className="dashboard__stat-card dashboard__stat-card--small">
            <div className="dashboard__stat-icon">
              <BsGraphUp />
            </div>
            <div className="dashboard__stat-content">
              <span className="dashboard__stat-label">Completion Rate</span>
              <span className="dashboard__stat-value">
                {summary.totalOrders > 0 
                  ? Math.round((orders.filter(o => o.status === 'completed').length / summary.totalOrders) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="dashboard__charts-row">
          {/* Revenue vs Expenses Line Chart */}
          <div className="dashboard__chart-card">
            <div className="dashboard__chart-header">
              <h3 className="dashboard__chart-title">Revenue vs Expenses Trend</h3>
              <div className="dashboard__chart-legend">
                <span className="dashboard__legend-item">
                  <span className="dashboard__legend-dot dashboard__legend-dot--revenue"></span>
                  Revenue
                </span>
                <span className="dashboard__legend-item">
                  <span className="dashboard__legend-dot dashboard__legend-dot--expenses"></span>
                  Expenses
                </span>
                <span className="dashboard__legend-item">
                  <span className="dashboard__legend-dot dashboard__legend-dot--profit"></span>
                  Profit
                </span>
              </div>
            </div>
            <div className="dashboard__chart-wrapper">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="name" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--white)',
                      color: 'var(--text-primary)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#f59e0b" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue/Expense/Profit Bar Chart */}
          <div className="dashboard__chart-card">
            <div className="dashboard__chart-header">
              <h3 className="dashboard__chart-title">Current Period Summary</h3>
            </div>
            <div className="dashboard__chart-wrapper">
              {revenueExpenseData && revenueExpenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueExpenseData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="name" stroke="var(--text-muted)" />
                    <YAxis stroke="var(--text-muted)" />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--white)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {revenueExpenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No data available for the selected period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="dashboard__charts-row">
          {/* Order Status Pie Chart */}
          <div className="dashboard__chart-card dashboard__chart-card--half">
            <div className="dashboard__chart-header">
              <h3 className="dashboard__chart-title">Order Status Distribution</h3>
            </div>
            <div className="dashboard__chart-wrapper dashboard__chart-wrapper--pie">
              {statusData && statusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatNumber(value)}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="dashboard__pie-legend">
                    {statusData.map((item, index) => (
                      <div key={index} className="dashboard__pie-legend-item">
                        <span className="dashboard__pie-color-dot" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No order data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Expense Categories Pie Chart */}
          <div className="dashboard__chart-card dashboard__chart-card--half">
            <div className="dashboard__chart-header">
              <h3 className="dashboard__chart-title">Expense by Category</h3>
            </div>
            <div className="dashboard__chart-wrapper dashboard__chart-wrapper--pie">
              {categoryData && categoryData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--white)',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="dashboard__pie-legend">
                    {categoryData.map((item, index) => (
                      <div key={index} className="dashboard__pie-legend-item">
                        <span className="dashboard__pie-color-dot" style={{ backgroundColor: item.color }}></span>
                        <span>{item.name}: {formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No expense data available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="dashboard__recent-orders">
          <div className="dashboard__section-header">
            <h3 className="dashboard__section-title">Recent Orders</h3>
            <button className="dashboard__view-all-btn" onClick={() => navigate('/all-orders')}>
              View All
            </button>
          </div>
          <div className="dashboard__table-wrapper">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders && orders.length > 0 ? (
                  orders.slice(0, 5).map((order) => (
                    <tr key={order._id} onClick={() => navigate(`/order-details/${order._id}`)}>
                      <td className="dashboard__table-order-id">{order.billNumber || order._id?.slice(-8) || 'N/A'}</td>
                      <td className="dashboard__table-customer">{order.customer?.name || 'N/A'}</td>
                      <td>{new Date(order.date || order.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="dashboard__table-amount">{formatCurrency(order.advancePayment || 0)}</td>
                      <td>
                        <span className={`dashboard__status-badge dashboard__status-badge--${order.status || 'pending'}`}>
                          {order.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                      No orders found
                    </td>
                  </tr>
                )}
              </tbody>
            </table> 
          </div>
        </div>
      </div>

      {/* Admin Expense Modal */}
      {showExpenseModal && (
        <div className="dashboard__modal-overlay">
          <div className="dashboard__modal">
            <div className="dashboard__modal-header">
              <h2 className="dashboard__modal-title">Add Admin Expense</h2>
              <button className="dashboard__modal-close" onClick={closeExpenseModal}>
                <FiX />
              </button>
            </div>
            
            {error && (
              <div className="dashboard__modal-error">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handleExpenseSubmit} className="dashboard__form">
              <div className="dashboard__form-group">
                <label className="dashboard__form-label">Amount (Rs)</label>
                <input
                  type="number"
                  name="amount"
                  value={expenseForm.amount}
                  onChange={handleExpenseChange}
                  placeholder="Enter amount"
                  required
                  min="0"
                  step="0.01"
                  className="dashboard__form-input"
                />
              </div>

              <div className="dashboard__form-group">
                <label className="dashboard__form-label">Category</label>
                <select
                  name="category"
                  value={expenseForm.category}
                  onChange={handleExpenseChange}
                  required
                  className="dashboard__form-select"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dashboard__form-group">
                <label className="dashboard__form-label">Description</label>
                <textarea
                  name="description"
                  value={expenseForm.description}
                  onChange={handleExpenseChange}
                  placeholder="Enter description"
                  rows="3"
                  required
                  className="dashboard__form-textarea"
                />
              </div>

              <div className="dashboard__form-row">
                <div className="dashboard__form-group">
                  <label className="dashboard__form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={expenseForm.date}
                    onChange={handleExpenseChange}
                    required
                    className="dashboard__form-input"
                  />
                </div>

                <div className="dashboard__form-group">
                  <label className="dashboard__form-label">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={expenseForm.paymentMethod}
                    onChange={handleExpenseChange}
                    required
                    className="dashboard__form-select"
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

              <div className="dashboard__modal-footer">
                <button 
                  type="button" 
                  className="dashboard__modal-btn dashboard__modal-btn--cancel" 
                  onClick={closeExpenseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="dashboard__modal-btn dashboard__modal-btn--submit" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="dashboard__spinner dashboard__spinner--small"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      Add Expense
                      <FiSave />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Payment Modal */}
      {showPaymentModal && (
        <div className="dashboard__modal-overlay">
          <div className="dashboard__modal">
            <div className="dashboard__modal-header">
              <h2 className="dashboard__modal-title">Add Admin Payment</h2>
              <button className="dashboard__modal-close" onClick={closePaymentModal}>
                <FiX />
              </button>
            </div>
            
            {error && (
              <div className="dashboard__modal-error">
                <p>{error}</p>
              </div>
            )}
            
            <form onSubmit={handlePaymentSubmit} className="dashboard__form">
              <div className="dashboard__form-group">
                <label className="dashboard__form-label">Amount (Rs)</label>
                <input
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentChange}
                  placeholder="Enter amount"
                  required
                  min="0"
                  step="0.01"
                  className="dashboard__form-input"
                />
              </div>

              <div className="dashboard__form-group">
                <label className="dashboard__form-label">Payment Type</label>
                <select
                  name="paymentType"
                  value={paymentForm.paymentType}
                  onChange={handlePaymentChange}
                  required
                  className="dashboard__form-select"
                >
                  {adminPaymentTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dashboard__form-group">
                <label className="dashboard__form-label">Description</label>
                <textarea
                  name="description"
                  value={paymentForm.description}
                  onChange={handlePaymentChange}
                  placeholder="Enter description"
                  rows="3"
                  required
                  className="dashboard__form-textarea"
                />
              </div>

              <div className="dashboard__form-group">
                <label className="dashboard__form-label">Reference (Optional)</label>
                <input
                  type="text"
                  name="reference"
                  value={paymentForm.reference}
                  onChange={handlePaymentChange}
                  placeholder="Enter reference number or note"
                  className="dashboard__form-input"
                />
              </div>

              <div className="dashboard__form-row">
                <div className="dashboard__form-group">
                  <label className="dashboard__form-label">Date</label>
                  <input
                    type="date"
                    name="date"
                    value={paymentForm.date}
                    onChange={handlePaymentChange}
                    required
                    className="dashboard__form-input"
                  />
                </div>

                <div className="dashboard__form-group">
                  <label className="dashboard__form-label">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={handlePaymentChange}
                    required
                    className="dashboard__form-select"
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

              <div className="dashboard__modal-footer">
                <button 
                  type="button" 
                  className="dashboard__modal-btn dashboard__modal-btn--cancel" 
                  onClick={closePaymentModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="dashboard__modal-btn dashboard__modal-btn--submit" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="dashboard__spinner dashboard__spinner--small"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      Add Payment
                      <FiSave />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;