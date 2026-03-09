import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPackage, FiSearch, FiFilter, FiCalendar,
  FiChevronRight, FiRefreshCw, FiX, FiDollarSign,
  FiUser, FiPhone, FiMapPin, FiClock
} from 'react-icons/fi';
import {
  BsCurrencyRupee, BsWallet2, BsBoxSeam,
  BsThreeDotsVertical
} from 'react-icons/bs';
import {
  MdPendingActions, MdOutlineLocalShipping,
  MdCheckCircle, MdOutlineRefresh
} from 'react-icons/md';
import Sidebar from '../../../components/Sidebar/Sidebar';
import { getAllOrders } from '../../../api/orderApi';
import './AllOrders.css';

const AllOrders = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [refreshing, setRefreshing] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'all', label: 'All Orders', color: 'var(--text-muted)' },
    { value: 'pending', label: 'Pending', icon: <MdPendingActions />, color: 'var(--warning-color)' },
    { value: 'in-progress', label: 'In Progress', icon: <MdOutlineLocalShipping />, color: 'var(--info-color)' },
    { value: 'completed', label: 'Completed', icon: <MdCheckCircle />, color: 'var(--success-color)' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'highest', label: 'Highest Amount' },
    { value: 'lowest', label: 'Lowest Amount' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchTerm, statusFilter, sortBy]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await getAllOrders();
      
      let ordersData = [];
      if (response.data?.data) {
        ordersData = response.data.data;
      } else if (response.data) {
        ordersData = response.data;
      } else if (Array.isArray(response)) {
        ordersData = response;
      }
      
      setOrders(ordersData);
      setFilteredOrders(ordersData);
      setError(null);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortOrders = () => {
    let filtered = [...orders];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.billNumber?.toLowerCase().includes(term) ||
        order.customer?.name?.toLowerCase().includes(term) ||
        order.customer?.phone?.includes(term)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        case 'oldest':
          return new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt);
        case 'highest':
          return (b.finalTotal || 0) - (a.finalTotal || 0);
        case 'lowest':
          return (a.finalTotal || 0) - (b.finalTotal || 0);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find(opt => opt.value === status) || statusOptions[0];
    return (
      <span className="allorder-status-badge" style={{ 
        backgroundColor: `var(--${status === 'pending' ? 'warning-color' : status === 'in-progress' ? 'info-color' : status === 'completed' ? 'success-color' : 'text-muted'})20`,
        color: option.color,
        borderColor: option.color + '40'
      }}>
        {option.icon && <span className="allorder-status-icon">{option.icon}</span>}
        <span>{option.label}</span>
      </span>
    );
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

  if (loading) {
    return (
      <div className="allorder-container">
        <Sidebar />
        <div className="allorder-content allorder-loading">
          <div className="allorder-spinner"></div>
          <h2>Loading Orders...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="allorder-container   ">
        <Sidebar />
        <div className="allorder-content allorder-error">
          <FiPackage className="allorder-error-icon" />
          <h2>Error Loading Orders</h2>
          <p>{error}</p>
          <button onClick={fetchOrders} className="allorder-refresh-btn">
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="allorder-container  sideber-container-Mobile">
      <Sidebar />
      
      <div className="allorder-content">
        {/* Header */}
        <div className="allorder-header">
          <div className="allorder-header-title">
            <h1>All Orders</h1>
            <p>Manage and view all your orders</p>
          </div>
          
          <div className="allorder-header-actions">
            <button 
              className="allorder-refresh-btn" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? 'allorder-spinning' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="allorder-search-filter-bar">
          <div className="allorder-search-wrapper">
            <FiSearch className="allorder-search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, customer name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="allorder-search-input"
            />
            {searchTerm && (
              <button className="allorder-clear-search" onClick={clearSearch}>
                <FiX />
              </button>
            )}
          </div>

          <div className="allorder-filter-wrapper">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="allorder-filter-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="allorder-filter-select"
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
        <div className="allorder-results-info">
          <span>Showing {filteredOrders.length} of {orders.length} orders</span>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="allorder-no-orders">
            <FiPackage className="allorder-no-data-icon" />
            <h3>No orders found</h3>
            <p>Try adjusting your search or filter to find what you're looking for.</p>
          </div>
        ) : (
          <div className="allorder-orders-grid">
            {filteredOrders.map((order) => (
              <div 
                key={order._id} 
                className="allorder-order-card"
                onClick={() => navigate(`/customer-orders/${order._id}`)}
              >
                {/* Card Header */}
                <div className="allorder-order-card-header">
                  <div className="allorder-order-title">
                    <h3 className="allorder-order-id">{order.billNumber || order._id?.slice(-8)}</h3>
                    <span className="allorder-order-date">
                      <FiCalendar />
                      {formatDate(order.date || order.createdAt)}
                    </span>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Customer Info */}
                <div className="allorder-order-customer-info">
                  <div className="allorder-customer-avatar">
                    {order.customer?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="allorder-customer-details">
                    <h4 className="allorder-customer-name">{order.customer?.name || 'Unknown Customer'}</h4>
                    <p className="allorder-customer-phone">
                      <FiPhone />
                      {order.customer?.phone || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Order Details */}
                <div className="allorder-order-details">
                  <div className="allorder-detail-item">
                    <FiDollarSign className="allorder-detail-icon" />
                    <div>
                      <span className="allorder-detail-label">Final Total</span>
                      <span className="allorder-detail-value">{formatCurrency(order.finalTotal)}</span>
                    </div>
                  </div>

                  <div className="allorder-detail-item">
                    <BsWallet2 className="allorder-detail-icon" />
                    <div>
                      <span className="allorder-detail-label">Advance</span>
                      <span className="allorder-detail-value">{formatCurrency(order.advancePayment || 0)}</span>
                    </div>
                  </div>

                  <div className="allorder-detail-item">
                    <BsCurrencyRupee className="allorder-detail-icon" />
                    <div>
                      <span className="allorder-detail-label">Remaining</span>
                      <span className="allorder-detail-value">{formatCurrency(order.remainingBalance || order.finalTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="allorder-order-footer">
                  <div className="allorder-payment-status">
                    <span className={`allorder-status-dot allorder-status-dot-${order.paymentStatus || 'pending'}`}></span>
                    <span>Payment: {order.paymentStatus || 'pending'}</span>
                  </div>
                  <button className="allorder-view-details-btn">
                    View Details <FiChevronRight />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOrders;