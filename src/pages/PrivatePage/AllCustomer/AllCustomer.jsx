import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FiUsers, FiSearch, FiPlus, FiEdit2, FiShoppingBag, 
  FiX, FiFilter, FiChevronRight, FiPackage, FiClock,
  FiCheckCircle, FiAlertCircle, FiDollarSign, FiChevronDown,
  FiGrid, FiList, FiEye
} from "react-icons/fi";
import { 
  BsPersonCircle, BsTelephone, BsGeoAlt,
  BsBoxSeam, BsCurrencyRupee, BsWallet2
} from "react-icons/bs";
import { 
  MdOutlineRefresh, MdOutlineClear,
  MdPendingActions, MdOutlineLocalShipping
} from "react-icons/md";
import { FaRegUserCircle } from "react-icons/fa";
import Sidebar from "../../../components/Sidebar/Sidebar";
import { getAllCustomers } from "../../../api/customerApi";
import { createOrder, getOrdersByCustomer } from "../../../api/orderApi";
import "./AllCustomer.css";

const AllCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderData, setOrderData] = useState({
    finalTotal: "",
    advancePayment: "",
    remainingBalance: 0,
    status: "pending",
    notes: ""
  });
  const [orderLoading, setOrderLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [customersWithOrders, setCustomersWithOrders] = useState(new Set());

  // New state for view mode (grid or list) - DEFAULT LIST
  const [viewMode, setViewMode] = useState(() => {
    // Get saved preference from localStorage
    const savedView = localStorage.getItem('customerViewMode');
    return savedView || 'list';
  });

  const navigate = useNavigate();

  // Status options
  const statusOptions = [
    { value: "pending", label: "Pending", icon: <MdPendingActions />, color: "#f59e0b" },
    { value: "in-progress", label: "In Progress", icon: <MdOutlineLocalShipping />, color: "#3b82f6" },
    { value: "completed", label: "Completed", icon: <FiCheckCircle />, color: "#10b981" }
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('customerViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (customers.length > 0) {
      const filtered = customers.filter(customer => 
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        (customer.address && customer.address.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCustomers(filtered);
    }
  }, [searchTerm, customers]);

  // Calculate remaining balance
  useEffect(() => {
    const finalTotal = parseFloat(orderData.finalTotal) || 0;
    const advancePayment = parseFloat(orderData.advancePayment) || 0;
    
    setOrderData(prev => ({
      ...prev,
      remainingBalance: Number((finalTotal - advancePayment).toFixed(2))
    }));
  }, [orderData.finalTotal, orderData.advancePayment]);

  // Show toast message
  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getAllCustomers();
      console.log("Customers response:", response);
      
      let customersData = [];
      
      // Handle different response formats
      if (response.data && Array.isArray(response.data)) {
        customersData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        customersData = response.data.data;
      } else if (Array.isArray(response)) {
        customersData = response;
      } else {
        customersData = [];
      }
      
      setCustomers(customersData);
      setFilteredCustomers(customersData);
      
      // Fetch orders for each customer to check if they have orders
      await checkCustomersOrders(customersData);
      
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError(error.response?.data?.message || error.message || "Failed to fetch customers");
      showToast("Failed to fetch customers", "error");
    } finally {
      setLoading(false);
    }
  };

  // Function to check which customers have orders
  const checkCustomersOrders = async (customersData) => {
    try {
      const customersWithOrdersSet = new Set();
      
      // Fetch orders for each customer
      await Promise.all(customersData.map(async (customer) => {
        try {
          const response = await getOrdersByCustomer(customer._id);
          let orders = [];
          
          if (response.data && response.data.data && Array.isArray(response.data.data)) {
            orders = response.data.data;
          } else if (response.data && Array.isArray(response.data)) {
            orders = response.data;
          } else if (Array.isArray(response)) {
            orders = response;
          }
          
          if (orders.length > 0) {
            customersWithOrdersSet.add(customer._id);
          }
        } catch (error) {
          console.error(`Error fetching orders for customer ${customer._id}:`, error);
        }
      }));
      
      setCustomersWithOrders(customersWithOrdersSet);
    } catch (error) {
      console.error("Error checking customers orders:", error);
    }
  };

  const fetchCustomerOrders = async (customerId) => {
    try {
      setOrdersLoading(true);
      const response = await getOrdersByCustomer(customerId);
      console.log("Customer orders:", response);
      
      let orders = [];
      
      // Handle different response formats
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        orders = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        orders = response.data;
      } else if (Array.isArray(response)) {
        orders = response;
      } else {
        orders = [];
      }
      
      setCustomerOrders(orders);
      
      // If orders exist, update the customersWithOrders set
      if (orders.length > 0) {
        setCustomersWithOrders(prev => new Set([...prev, customerId]));
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      showToast(error.response?.data?.message || "Failed to fetch orders", "error");
      setCustomerOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  // Edit handler
  const handleEdit = (e, customer) => {
    e.stopPropagation();
    navigate(`/edit-customer/${customer._id}`, { 
      state: { customerData: customer } 
    });
  };

  const handleViewOrders = (e, customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer._id);
    setShowOrdersModal(true);
  };

  const handleViewDetails = (e, customer) => {
    e.stopPropagation();
    navigate(`/Customer-Detail/${customer._id}`);
  };

  const handleCreateOrder = (e, customer) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setShowOrderModal(true);
    setOrderData({
      finalTotal: "",
      advancePayment: "",
      remainingBalance: 0,
      status: "pending",
      notes: ""
    });
  };

  const handleOrderSubmit = async () => {
    // Validation
    const finalTotal = parseFloat(orderData.finalTotal);
    const advancePayment = parseFloat(orderData.advancePayment) || 0;

    if (!finalTotal || finalTotal <= 0) {
      showToast("Please enter valid final total amount", "error");
      return;
    }

    if (advancePayment > finalTotal) {
      showToast("Advance payment cannot be greater than final total", "error");
      return;
    }

    if (!selectedCustomer?._id) {
      showToast("Customer information is missing", "error");
      return;
    }

    try {
      setOrderLoading(true);
      setError(null);
      
      // Generate bill number
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const billNumber = `ORD-${timestamp.toString().slice(-8)}-${random}`;
      
      // Create order payload
      const orderPayload = {
        customer: selectedCustomer._id,
        finalTotal: finalTotal,
        advancePayment: advancePayment,
        billNumber: billNumber,
        date: new Date().toISOString(),
        status: orderData.status,
        notes: orderData.notes || ''
      };

      console.log("Creating order with payload:", orderPayload);
      
      const response = await createOrder(orderPayload);
      console.log("Order created successfully:", response.data);

      // Close modal and reset state
      setShowOrderModal(false);
      setSelectedCustomer(null);
      setOrderData({
        finalTotal: "",
        advancePayment: "",
        remainingBalance: 0,
        status: "pending",
        notes: ""
      });
      
      showToast("Order created successfully!", "success");
      
      // Add this customer to customersWithOrders set
      setCustomersWithOrders(prev => new Set([...prev, selectedCustomer._id]));
      
      // Refresh customers list
      fetchCustomers();
      
    } catch (error) {
      console.error("Error creating order:", error);
      
      const errorMessage = error.response?.data?.message 
        || error.response?.data?.error 
        || error.message 
        || "Error creating order";
      
      showToast(errorMessage, "error");
    } finally {
      setOrderLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Allow empty string or valid numbers
    if (name === "finalTotal" || name === "advancePayment") {
      if (value === "" || value === "0") {
        setOrderData({ ...orderData, [name]: "" });
      } else if (!isNaN(value) && parseFloat(value) >= 0) {
        setOrderData({ ...orderData, [name]: value });
      }
    } else {
      setOrderData({ ...orderData, [name]: value });
    }
  };

  const handleStatusSelect = (statusValue) => {
    console.log("Selected status:", statusValue);
    setOrderData(prev => ({
      ...prev,
      status: statusValue
    }));
    setIsStatusDropdownOpen(false);
  };

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find(s => s.value === status) || statusOptions[0];
    return (
      <span className={`status-badge-customer-page ${status}`} style={{ backgroundColor: statusOption.color + '20', color: statusOption.color }}>
        {statusOption.icon}
        {statusOption.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Rs 0";
    return `Rs ${Number(amount).toFixed(2).toLocaleString('en-PK')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleRefresh = () => {
    fetchCustomers();
    setSearchTerm("");
  };

  // Toggle view mode
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  // Get current selected status details
  const selectedStatus = statusOptions.find(s => s.value === orderData.status) || statusOptions[0];

  // Check if button should be disabled
  const isButtonDisabled = () => {
    if (orderLoading) return true;
    
    const finalTotal = parseFloat(orderData.finalTotal);
    const advancePayment = parseFloat(orderData.advancePayment);
    
    if (isNaN(finalTotal) || finalTotal <= 0) return true;
    if (!isNaN(advancePayment) && advancePayment > finalTotal) return true;
    
    return false;
  };

  // Loading state
  if (loading) {
    return (
      <div className="main-container-customer-page">
        <Sidebar />
        <div className="content-wrapper-customer-page loading-container-customer-page">
          <div className="loading-spinner-customer-page">
            <FiPackage className="spinner-icon-customer-page" />
            <h2>Loading Customers...</h2>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="main-container-customer-page">
        <Sidebar />
        <div className="content-wrapper-customer-page error-container-customer-page">
          <div className="error-content-customer-page">
            <FiAlertCircle className="error-icon-customer-page" />
            <h2>Error Loading Customers</h2>
            <p>{error}</p>
            <button onClick={handleRefresh} className="refresh-btn-customer-page">
              <MdOutlineRefresh className="btn-icon-customer-page" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container-customer-page    sideber-container-Mobile">
      <Sidebar />
      
      <div className="content-wrapper-customer-page">
        {/* Toast Message */}
        {toast.show && (
          <div className={`toast-message-customer-page ${toast.type}`}>
            <div className="toast-content-customer-page">
              <span className="toast-text-customer-page">{toast.message}</span>
            </div>
            <button className="toast-close-customer-page" onClick={() => setToast({ show: false })}>×</button>
          </div>
        )}

        {/* Header */}
        <div className="page-header-customer-page">
          <div className="header-title-customer-page">
            <FiUsers className="header-icon-customer-page" />
            <h1>All Customers</h1>
            <span className="customer-count-customer-page">{customers.length}</span>
          </div>
          <div className="header-actions-customer-page">
            {/* View Mode Toggle Buttons */}
            <div className="view-toggle-container-customer-page">
              <button 
                className={`view-toggle-btn-customer-page ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => toggleViewMode('grid')}
                title="Grid View"
              >
                <FiGrid />
              </button>
              <button 
                className={`view-toggle-btn-customer-page ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => toggleViewMode('list')}
                title="List View"
              >
                <FiList />
              </button>
            </div>
            <button onClick={handleRefresh} className="refresh-btn-customer-page" title="Refresh">
              <MdOutlineRefresh className="btn-icon-customer-page" />
            </button>
            <button 
              className="add-customer-btn-customer-page"
              onClick={() => navigate("/admin-add-customer")}
            >
              <FiPlus className="btn-icon-customer-page" />
              Add New Customer
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-section-customer-page">
          <div className="search-wrapper-customer-page">
            <FiSearch className="search-icon-customer-page" />
            <input
              type="text"
              placeholder="Search by name, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-customer-page"
            />
            {searchTerm && (
              <button 
                className="clear-search-customer-page"
                onClick={() => setSearchTerm("")}
              >
                <MdOutlineClear />
              </button>
            )}
          </div>
          <div className="search-stats-customer-page">
            <FiFilter className="stats-icon-customer-page" />
            Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Customers Grid/List */}
        {filteredCustomers.length === 0 ? (
          <div className="no-customers-customer-page">
            <FaRegUserCircle className="no-data-icon-customer-page" />
            <p>No customers found</p>
            {searchTerm && (
              <button 
                className="clear-search-btn-customer-page"
                onClick={() => setSearchTerm("")}
              >
                <MdOutlineRefresh className="btn-icon-customer-page" />
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className={`customers-container-customer-page ${viewMode === 'grid' ? 'grid-view-customer-page' : 'list-view-customer-page'}`}>
            {filteredCustomers.map((customer) => {
              const hasOrders = customersWithOrders.has(customer._id);
              
              return (
                <div
                  key={customer._id}
                  className={`customer-card-customer-page ${viewMode === 'list' ? 'list-view-card-customer-page' : ''}`}
                >
                  <div className="customer-card-header-customer-page">
                    <div className="customer-avatar-customer-page">
                      {customer.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="customer-header-info-customer-page">
                      <h3 className="customer-name-customer-page">{customer.name || 'Unknown'}</h3>
                      <span className="customer-id-customer-page">ID: {customer._id?.slice(-6) || 'N/A'}</span>
                    </div>
                  </div>

                  <div 
                    className="customer-info-customer-page clickable-area-customer-page"
                    onClick={() => navigate(`/Customer-Detail/${customer._id}`)}
                  >
                    <div className="info-item-customer-page">
                      <BsTelephone className="info-icon-customer-page" />
                      <div className="info-content-customer-page">
                        <span className="info-value-customer-page">{customer.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="info-item-customer-page">
                      <BsGeoAlt className="info-icon-customer-page" />
                      <div className="info-content-customer-page">
                        <span className="info-value-customer-page">
                          {customer.address || "Not provided"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Conditional Actions - Grid me buttons, List me icons */}
                  {viewMode === 'grid' ? (
                    /* Grid View - Buttons with Text */
                    <div className="customer-card-actions-customer-page grid-actions">
                      <button
                        className="action-btn-customer-page edit-btn-customer-page"
                        onClick={(e) => handleEdit(e, customer)}
                      >
                        <FiEdit2 className="btn-icon-customer-page" />
                        Edit
                      </button>
                      <button
                        className="action-btn-customer-page view-orders-btn-customer-page"
                        onClick={(e) => handleViewOrders(e, customer)}
                      >
                        <FiPackage className="btn-icon-customer-page" />
                        Orders
                      </button>
                      {hasOrders ? (
                        <button
                          className="action-btn-customer-page view-details-btn-customer-page"
                          onClick={(e) => handleViewDetails(e, customer)}
                        >
                          <FiEye className="btn-icon-customer-page" />
                          Details
                        </button>
                      ) : (
                        <button
                          className="action-btn-customer-page order-btn-customer-page"
                          onClick={(e) => handleCreateOrder(e, customer)}
                        >
                          <FiShoppingBag className="btn-icon-customer-page" />
                          New Order
                        </button>
                      )}
                    </div>
                  ) : (
                    /* List View - Icons Only */
                    <div className="customer-card-actions-customer-page list-actions">
                      <button
                        className="action-icon-customer-page edit-icon-customer-page"
                        onClick={(e) => handleEdit(e, customer)}
                        title="Edit Customer"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="action-icon-customer-page orders-icon-customer-page"
                        onClick={(e) => handleViewOrders(e, customer)}
                        title="View Orders"
                      >
                        <FiPackage />
                      </button>
                      {hasOrders ? (
                        <button
                          className="action-icon-customer-page view-icon-customer-page"
                          onClick={(e) => handleViewDetails(e, customer)}
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                      ) : (
                        <button
                          className="action-icon-customer-page order-icon-customer-page"
                          onClick={(e) => handleCreateOrder(e, customer)}
                          title="New Order"
                        >
                          <FiShoppingBag />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Arrow for List View */}
                  {viewMode === 'list' && (
                    <div 
                      className="card-footer-customer-page"
                      onClick={() => navigate(`/Customer-Detail/${customer._id}`)}
                    >
                      <FiChevronRight className="view-details-icon-customer-page" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Create Order Modal */}
        {showOrderModal && selectedCustomer && (
          <div className="modal-overlay-customer-page" onClick={() => setShowOrderModal(false)}>
            <div className="modal-content-customer-page order-modal-customer-page" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-customer-page">
                <div className="modal-header-title-customer-page">
                  <FiShoppingBag className="modal-icon-customer-page" />
                  <h2>Create New Order</h2>
                </div>
                <button className="close-modal-customer-page" onClick={() => setShowOrderModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body-customer-page">
                {/* Customer Info Card */}
                <div className="customer-info-card-customer-page">
                  <div className="customer-info-avatar-customer-page">
                    {selectedCustomer.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="customer-info-details-customer-page">
                    <h3 className="customer-info-name-customer-page">{selectedCustomer.name}</h3>
                    <p className="customer-info-phone-customer-page">
                      <BsTelephone className="info-icon-small-customer-page" /> {selectedCustomer.phone}
                    </p>
                    {selectedCustomer.address && (
                      <p className="customer-info-address-customer-page">
                        <BsGeoAlt className="info-icon-small-customer-page" /> {selectedCustomer.address}
                      </p>
                    )}
                    <span className="customer-info-id-customer-page">ID: {selectedCustomer._id?.slice(-8)}</span>
                  </div>
                </div>

                {/* Custom Status Select Box */}
                <div className="form-card-customer-page">
                  <div className="form-card-header-customer-page">
                    <FiClock className="form-card-icon-customer-page" />
                    <h4>Order Status</h4>
                  </div>
                  
                  <div className="custom-status-select-container-customer-page">
                    <div 
                      className={`custom-status-select-customer-page ${isStatusDropdownOpen ? 'open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsStatusDropdownOpen(!isStatusDropdownOpen);
                      }}
                    >
                      <div className="selected-status-customer-page" style={{ color: selectedStatus.color }}>
                        <span className="status-icon-customer-page">{selectedStatus.icon}</span>
                        <span className="status-label-customer-page">{selectedStatus.label}</span>
                      </div>
                      <FiChevronDown className={`dropdown-arrow-customer-page ${isStatusDropdownOpen ? 'rotate' : ''}`} />
                    </div>
                    
                    {isStatusDropdownOpen && (
                      <div className="status-dropdown-menu-customer-page">
                        {statusOptions.map(option => (
                          <div
                            key={option.value}
                            className={`status-dropdown-item-customer-page ${orderData.status === option.value ? 'selected' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleStatusSelect(option.value);
                            }}
                          >
                            <span className="status-icon-customer-page" style={{ color: option.color }}>
                              {option.icon}
                            </span>
                            <span className="status-label-customer-page">{option.label}</span>
                            {orderData.status === option.value && (
                              <span className="check-mark-customer-page">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Details Card */}
                <div className="form-card-customer-page">
                  <div className="form-card-header-customer-page">
                    <BsCurrencyRupee className="form-card-icon-customer-page" />
                    <h4>Payment Details</h4>
                  </div>
                  
                  <div className="payment-inputs-customer-page">
                    <div className="input-group-customer-page">
                      <label>
                        <BsCurrencyRupee className="input-icon-customer-page" />
                        Final Total (Rs)
                      </label>
                      <input
                        type="number"
                        name="finalTotal"
                        value={orderData.finalTotal}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter final total amount"
                        className="order-final-total-input-customer-page"
                        required
                      />
                    </div>

                    <div className="input-group-customer-page">
                      <label>
                        <BsWallet2 className="input-icon-customer-page" />
                        Advance Payment (Rs)
                      </label>
                      <input
                        type="number"
                        name="advancePayment"
                        value={orderData.advancePayment}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        placeholder="Enter advance payment amount"
                        className="order-advance-input-customer-page"
                      />
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="input-group-customer-page">
                    <label>
                      <FiPackage className="input-icon-customer-page" />
                      Notes (Optional)
                    </label>
                    <textarea
                      name="notes"
                      value={orderData.notes}
                      onChange={handleInputChange}
                      placeholder="Add any notes about this order..."
                      className="order-notes-input-customer-page"
                      rows="2"
                    />
                  </div>

                  {orderData.finalTotal && parseFloat(orderData.finalTotal) > 0 && (
                    <div className="payment-summary-card-customer-page">
                      <div className="summary-row-customer-page">
                        <span>Final Total:</span>
                        <span className="summary-amount-customer-page">{formatCurrency(parseFloat(orderData.finalTotal) || 0)}</span>
                      </div>
                      {orderData.advancePayment && parseFloat(orderData.advancePayment) > 0 && (
                        <>
                          <div className="summary-row-customer-page">
                            <span>Advance Payment:</span>
                            <span className="summary-amount-customer-page advance-customer-page">{formatCurrency(parseFloat(orderData.advancePayment) || 0)}</span>
                          </div>
                          <div className="summary-row-customer-page total-row-customer-page">
                            <span>Remaining Balance:</span>
                            <span className={`summary-amount-customer-page ${orderData.remainingBalance === 0 ? 'paid-customer-page' : 'pending-customer-page'}`}>
                              {formatCurrency(orderData.remainingBalance)}
                            </span>
                          </div>
                          <div className="payment-status-row-customer-page">
                            <span>Payment Status:</span>
                            <span className={`payment-status-badge-customer-page ${
                              parseFloat(orderData.advancePayment) >= parseFloat(orderData.finalTotal) ? 'paid-customer-page' : 
                              parseFloat(orderData.advancePayment) > 0 ? 'partial-customer-page' : 'pending-customer-page'
                            }`}>
                              {parseFloat(orderData.advancePayment) >= parseFloat(orderData.finalTotal) ? 'Paid' : 
                               parseFloat(orderData.advancePayment) > 0 ? 'Partial' : 'Pending'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Order Summary Card */}
                {orderData.finalTotal && parseFloat(orderData.finalTotal) > 0 && (
                  <div className="order-summary-card-customer-page">
                    <div className="summary-card-header-customer-page">
                      <FiShoppingBag className="summary-icon-customer-page" />
                      <h4>Order Summary</h4>
                    </div>
                    <div className="summary-grid-customer-page">
                      <div className="summary-item-customer-page">
                        <span className="summary-label-customer-page">Final Total</span>
                        <span className="summary-value-customer-page final-customer-page">{formatCurrency(parseFloat(orderData.finalTotal) || 0)}</span>
                      </div>
                      <div className="summary-item-customer-page">
                        <span className="summary-label-customer-page">Advance</span>
                        <span className="summary-value-customer-page advance-customer-page">{formatCurrency(parseFloat(orderData.advancePayment) || 0)}</span>
                      </div>
                      <div className="summary-item-customer-page">
                        <span className="summary-label-customer-page">Remaining</span>
                        <span className="summary-value-customer-page remaining-customer-page">{formatCurrency(orderData.remainingBalance)}</span>
                      </div>
                      <div className="summary-item-customer-page full-width-customer-page">
                        <span className="summary-label-customer-page">Order Status</span>
                        <div className={`status-badge-large-customer-page ${orderData.status}`} style={{ backgroundColor: selectedStatus.color + '20', color: selectedStatus.color }}>
                          {selectedStatus.icon}
                          <span>{selectedStatus.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer-customer-page">
                <button 
                  className="cancel-btn-customer-page"
                  onClick={() => setShowOrderModal(false)}
                  disabled={orderLoading}
                >
                  Cancel
                </button>
                <button 
                  className="submit-btn-customer-page"
                  onClick={handleOrderSubmit}
                  disabled={isButtonDisabled()}
                >
                  {orderLoading ? (
                    <>
                      <FiPackage className="spinning-customer-page" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiShoppingBag />
                      Create Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Orders Modal */}
        {showOrdersModal && selectedCustomer && (
          <div className="modal-overlay-customer-page" onClick={() => setShowOrdersModal(false)}>
            <div className="modal-content-customer-page orders-modal-customer-page" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-customer-page">
                <div className="modal-header-title-customer-page">
                  <FiPackage className="modal-icon-customer-page" />
                  <h2>Customer Orders</h2>
                </div>
                <button className="close-modal-customer-page" onClick={() => setShowOrdersModal(false)}>
                  <FiX />
                </button>
              </div>

              <div className="modal-body-customer-page">
                <div className="selected-customer-info-customer-page">
                  <BsPersonCircle className="customer-modal-icon-customer-page" />
                  <div className="customer-modal-details-customer-page">
                    <h3>{selectedCustomer.name}</h3>
                    <p><BsTelephone className="detail-icon-customer-page" /> {selectedCustomer.phone}</p>
                  </div>
                </div>

                {ordersLoading ? (
                  <div className="orders-loading-customer-page">
                    <FiPackage className="spinner-icon-customer-page" />
                    <p>Loading orders...</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="no-orders-customer-page">
                    <FiPackage className="no-data-icon-customer-page" />
                    <p>No orders found for this customer</p>
                  </div>
                ) : (
                  <div className="orders-list-customer-page">
                    {customerOrders.map((order) => (
                      <div key={order._id} className="order-item-customer-page">
                        <div className="order-header-customer-page">
                          <span className="order-bill-customer-page">{order.billNumber}</span>
                          <span className="order-date-customer-page">{formatDate(order.date)}</span>
                          {getStatusBadge(order.status || 'pending')}
                        </div>
                        <div className="order-footer-customer-page">
                          <div className="payment-info-customer-page">
                            <span className="order-total-customer-page">{formatCurrency(order.finalTotal)}</span>
                            {order.advancePayment > 0 && (
                              <span className="advance-badge-customer-page">Adv: {formatCurrency(order.advancePayment)}</span>
                            )}
                          </div>
                          <button 
                            className="view-order-btn-customer-page"
                            onClick={() => navigate(`/customer-orders/${order._id}`)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer-customer-page">
                <button 
                  className="cancel-btn-customer-page"
                  onClick={() => setShowOrdersModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllCustomer;