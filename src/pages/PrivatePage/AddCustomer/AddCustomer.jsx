import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { createCustomer, updateCustomer, getCustomerById } from "../../../api/customerApi";
import { createJob, getCustomerJobs, updateJob, fetchJobsByCustomer } from "../../../api/jobApi";
import { getProfile } from "../../../api/profileApi";
import Sidebar from "../../../components/Sidebar/Sidebar";
import { FiCheckCircle, FiPrinter, FiX, FiPackage, FiDollarSign, FiShoppingBag } from "react-icons/fi";
import { BsShop, BsTelephone, BsGeoAlt } from "react-icons/bs";
import "./AddCustomer.css";

export default function AddCustomer() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // CUSTOMER
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [customerSaved, setCustomerSaved] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  // EDIT MODE STATES
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);

  // BUSINESS PROFILE
  const [businessProfile, setBusinessProfile] = useState(null);

  // ESTIMATED AMOUNTS (Low, Medium, High)
  const [estimatedAmounts, setEstimatedAmounts] = useState({
    low: "",
    medium: "",
    high: ""
  });

  // WORK ITEMS & MATERIALS COMBINED
  const [workName, setWorkName] = useState("");
  const [workQty, setWorkQty] = useState(1);
  
  // MATERIALS (Expenses) for current work
  const [currentWorkMaterials, setCurrentWorkMaterials] = useState([]);
  const [matName, setMatName] = useState("");
  const [matQty, setMatQty] = useState(1);
  const [matRate, setMatRate] = useState(0);

  // All combined items for display
  const [allItems, setAllItems] = useState([]);

  // Saved Bills from Backend
  const [savedBills, setSavedBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // Edit mode states for items
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingExpenseIndex, setEditingExpenseIndex] = useState(null);
  const [editingWorkName, setEditingWorkName] = useState("");
  const [editingWorkQty, setEditingWorkQty] = useState(1);
  const [editingExpense, setEditingExpense] = useState({ name: "", qty: 1, rate: 0, total: 0 });
  
  // Add expense mode in edit
  const [addingExpenseInEdit, setAddingExpenseInEdit] = useState(false);
  const [newExpenseInEdit, setNewExpenseInEdit] = useState({ name: "", qty: 1, rate: 0 });

  // Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Success Overlay state
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [savedBillData, setSavedBillData] = useState(null);

  // Loading states
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingBill, setSavingBill] = useState(false);

  // Check if we're in edit mode on component mount
  useEffect(() => {
    checkEditMode();
  }, [location.pathname, location.state]);

  // Load business profile on mount
  useEffect(() => {
    loadBusinessProfile();
  }, []);

  // Load saved bills when customer is saved
  useEffect(() => {
    if (customerId) {
      fetchSavedBills(customerId);
    }
  }, [customerId]);

  // Recalculate expenseTotal for all items whenever allItems changes
  useEffect(() => {
    if (allItems.length > 0) {
      const updatedItems = allItems.map(item => {
        // Calculate expenseTotal for each work
        const expenseTotal = item.materials?.reduce((sum, mat) => {
          const materialTotal = (parseFloat(mat.qty) || 0) * (parseFloat(mat.rate) || 0);
          return sum + materialTotal;
        }, 0) || 0;
        
        return {
          ...item,
          expenseTotal: expenseTotal
        };
      });
      
      // Only update if values have changed to avoid infinite loop
      const hasChanged = updatedItems.some((item, index) => 
        item.expenseTotal !== allItems[index].expenseTotal
      );
      
      if (hasChanged) {
        setAllItems(updatedItems);
      }
    }
  }, [allItems.map(item => JSON.stringify(item.materials)).join(',')]);

  // Check if we're in edit mode and load customer data with all jobs
  const checkEditMode = async () => {
    console.log("Current path:", location.pathname);
    console.log("Location state:", location.state);
    
    const currentPath = location.pathname;
    
    // Check if we're on the add-customer page
    if (currentPath === '/add-customer' || currentPath.includes('admin-add-customer') || currentPath.endsWith('add-customer')) {
      console.log("On add customer page - not edit mode");
      setIsEditMode(false);
      setCustomer({ name: "", phone: "", address: "" });
      setCustomerId(null);
      setCustomerSaved(false);
      setAllItems([]);
      setEstimatedAmounts({ low: "", medium: "", high: "" });
      return;
    }
    
    // Check if we have customer data from navigation state (from AllCustomer page)
    if (location.state?.customerData) {
      const customerData = location.state.customerData;
      console.log("Loading customer from state:", customerData);
      
      if (!customerData._id) {
        console.error("Customer data has no ID");
        showToast('Invalid customer data', 'error');
        navigate('/add-customer');
        return;
      }
      
      setIsEditMode(true);
      setCustomer({
        name: customerData.name || '',
        phone: customerData.phone || '',
        address: customerData.address || ''
      });
      setCustomerId(customerData._id);
      setCustomerSaved(true);
      
      // Load all jobs for this customer
      await loadCustomerJobs(customerData._id);
      
      showToast('Customer loaded for editing', 'success');
    } 
    // Check if we have an ID in the URL (for direct access)
    else {
      const pathParts = location.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      
      console.log("Last part of URL:", lastPart);
      
      // Check if it's a valid MongoDB ObjectId (24 characters hex)
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(lastPart);
      
      if (isValidObjectId) {
        console.log("Loading customer by ID from URL:", lastPart);
        await loadCustomerForEdit(lastPart);
      } else {
        console.log("Not a valid customer ID, redirecting to add customer");
        navigate('/add-customer');
      }
    }
  };

  // Load customer by ID for editing
  const loadCustomerForEdit = async (id) => {
    try {
      setLoadingCustomer(true);
      const response = await getCustomerById(id);
      console.log("Customer loaded for edit:", response.data);
      
      let customerData;
      if (response.data.customer) {
        customerData = response.data.customer;
      } else {
        customerData = response.data;
      }
      
      setIsEditMode(true);
      setCustomer({
        name: customerData.name || '',
        phone: customerData.phone || '',
        address: customerData.address || ''
      });
      setCustomerId(customerData._id || customerData.id);
      setCustomerSaved(true);
      
      // Load all jobs for this customer
      await loadCustomerJobs(customerData._id || customerData.id);
      
      showToast('Customer loaded for editing', 'success');
    } catch (error) {
      console.error("Error loading customer:", error);
      showToast('Failed to load customer data', 'error');
    } finally {
      setLoadingCustomer(false);
    }
  };

  // Load all jobs for a customer
  const loadCustomerJobs = async (custId) => {
    try {
      setLoadingJobs(true);
      const response = await fetchJobsByCustomer(custId);
      console.log("Customer jobs loaded:", response.data);
      
      // Handle different response formats
      let jobsData = [];
      if (response.data && response.data.data) {
        jobsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        jobsData = response.data;
      } else if (Array.isArray(response)) {
        jobsData = response;
      }
      
      // Transform jobs to allItems format
      if (jobsData.length > 0) {
        // Use the most recent job
        const latestJob = jobsData[0];
        setCurrentJobId(latestJob._id);
        
        // Load works with proper calculations
        if (latestJob.works && latestJob.works.length > 0) {
          const processedWorks = latestJob.works.map(work => ({
            name: work.name || '',
            qty: Number(work.qty) || 1,
            materials: (work.materials || []).map(mat => ({
              name: mat.name || '',
              qty: Number(mat.qty) || 1,
              rate: Number(mat.rate) || 0,
              total: (Number(mat.qty) || 1) * (Number(mat.rate) || 0)
            })),
            expenseTotal: (work.materials || []).reduce((sum, mat) => 
              sum + ((Number(mat.qty) || 1) * (Number(mat.rate) || 0)), 0
            )
          }));
          
          setAllItems(processedWorks);
        }
        
        // Load estimated amounts if they exist
        if (latestJob.estimatedAmounts) {
          setEstimatedAmounts({
            low: latestJob.estimatedAmounts.low || "",
            medium: latestJob.estimatedAmounts.medium || "",
            high: latestJob.estimatedAmounts.high || ""
          });
        }
        
        showToast('Customer jobs loaded', 'success');
      }
    } catch (error) {
      console.error("Error loading customer jobs:", error);
      showToast('Failed to load customer jobs', 'error');
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadBusinessProfile = async () => {
    try {
      const data = await getProfile();
      console.log("Business profile loaded:", data);
      setBusinessProfile(data.data || data);
    } catch (error) {
      console.log("No business profile found or error loading:", error);
    }
  };

  const fetchSavedBills = async (custId) => {
    try {
      setLoadingBills(true);
      const response = await fetchJobsByCustomer(custId);
      console.log("Saved bills fetched:", response.data);
      
      // Handle different response formats
      let billsData = [];
      if (response.data && response.data.data) {
        billsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        billsData = response.data;
      } else if (Array.isArray(response)) {
        billsData = response;
      }
      
      setSavedBills(billsData);
    } catch (error) {
      console.error("Error fetching saved bills:", error);
    } finally {
      setLoadingBills(false);
    }
  };

  const showToast = (message, type) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const closeToast = () => {
    setToast({ show: false, message: "", type: "" });
  };

  // SAVE/UPDATE CUSTOMER - Using API with redirect to /admin-all-customer
  const saveCustomer = async () => {
    if (!customer.name || !customer.phone) {
      showToast("Please fill customer name and phone", "error");
      return;
    }
    
    try {
      setSavingCustomer(true);
      
      let response;
      if (isEditMode && customerId) {
        // Update existing customer
        response = await updateCustomer(customerId, customer);
        console.log("Customer updated:", response.data);
        showToast("Customer Updated Successfully", "success");
        
        // ✅ Redirect to /admin-all-customer after successful update
        setTimeout(() => {
          navigate('/admin-all-customer');
        }, 1500);
        
      } else {
        // Create new customer
        response = await createCustomer(customer);
        console.log("Customer saved:", response.data);
        showToast("Customer Saved Successfully", "success");
        
        setCustomerSaved(true);
        
        // Handle different response formats
        let savedCustomerData;
        if (response.data.customer) {
          savedCustomerData = response.data.customer;
        } else {
          savedCustomerData = response.data;
        }
        
        setCustomer(savedCustomerData);
        setCustomerId(savedCustomerData._id || savedCustomerData.id);
      }
      
    } catch (err) {
      console.error("Error saving customer:", err);
      showToast(err.response?.data?.message || `Error ${isEditMode ? 'updating' : 'saving'} customer`, "error");
    } finally {
      setSavingCustomer(false);
    }
  };

  // ADD EXPENSE TO CURRENT WORK
  const addExpense = () => {
    if (!matName || matQty <= 0 || matRate <= 0) {
      showToast("Please enter valid material details", "error");
      return;
    }
    
    const qty = parseInt(matQty) || 1;
    const rate = parseFloat(matRate) || 0;
    const total = qty * rate;
    
    const newExpense = {
      name: matName,
      qty: qty,
      rate: rate,
      total: total,
      type: 'expense'
    };

    setCurrentWorkMaterials([...currentWorkMaterials, newExpense]);
    setMatName("");
    setMatQty(1);
    setMatRate(0);
  };

  // ADD EXPENSE IN EDIT MODE
  const addExpenseInEdit = () => {
    if (!newExpenseInEdit.name || newExpenseInEdit.qty <= 0 || newExpenseInEdit.rate <= 0) {
      showToast("Please enter valid expense details", "error");
      return;
    }

    const updatedItems = [...allItems];
    const qty = parseInt(newExpenseInEdit.qty) || 1;
    const rate = parseFloat(newExpenseInEdit.rate) || 0;
    const newTotal = qty * rate;
    
    updatedItems[editingItemIndex].materials.push({
      name: newExpenseInEdit.name,
      qty: qty,
      rate: rate,
      total: newTotal
    });

    // Recalculate expense total for the work
    updatedItems[editingItemIndex].expenseTotal =
      updatedItems[editingItemIndex].materials.reduce((sum, exp) => sum + exp.total, 0);

    setAllItems(updatedItems);
    setNewExpenseInEdit({ name: "", qty: 1, rate: 0 });
    setAddingExpenseInEdit(false);
    showToast("Expense added successfully", "success");
  };

  // SAVE CURRENT WORK WITH ALL ITS EXPENSES
  const saveWorkWithExpenses = () => {
    if (!workName || workQty <= 0) {
      showToast("Please enter valid work name and quantity", "error");
      return;
    }

    const expenseTotal = currentWorkMaterials.reduce((sum, exp) => sum + exp.total, 0);
    
    const newWork = {
      name: workName,
      qty: Number(workQty),
      materials: currentWorkMaterials,
      expenseTotal: expenseTotal
    };

    setAllItems([...allItems, newWork]);

    // Clear current work form
    setWorkName("");
    setWorkQty(1);
    setCurrentWorkMaterials([]);
  };

  // INCREASE QUANTITY
  const increaseQuantity = (itemIndex) => {
    const updatedItems = [...allItems];
    updatedItems[itemIndex].qty += 1;
    setAllItems(updatedItems);
    showToast("Quantity increased", "success");
  };

  // DECREASE QUANTITY
  const decreaseQuantity = (itemIndex) => {
    const updatedItems = [...allItems];
    if (updatedItems[itemIndex].qty > 1) {
      updatedItems[itemIndex].qty -= 1;
      setAllItems(updatedItems);
      showToast("Quantity decreased", "success");
    } else {
      showToast("Quantity cannot be less than 1", "error");
    }
  };

  // START EDITING WORK
  const startEditingWork = (itemIndex) => {
    const item = allItems[itemIndex];
    setEditingItemIndex(itemIndex);
    setEditingExpenseIndex(null);
    setAddingExpenseInEdit(false);
    setEditingWorkName(item.name);
    setEditingWorkQty(item.qty);
  };

  // SAVE WORK EDIT
  const saveWorkEdit = () => {
    if (!editingWorkName || editingWorkQty <= 0) {
      showToast("Please enter valid work name and quantity", "error");
      return;
    }

    const updatedItems = [...allItems];
    updatedItems[editingItemIndex] = {
      ...updatedItems[editingItemIndex],
      name: editingWorkName,
      qty: parseInt(editingWorkQty)
    };

    setAllItems(updatedItems);
    setEditingItemIndex(null);
    setEditingWorkName("");
    setEditingWorkQty(1);
    showToast("Work updated successfully", "success");
  };

  // CANCEL EDIT
  const cancelEdit = () => {
    setEditingItemIndex(null);
    setEditingExpenseIndex(null);
    setAddingExpenseInEdit(false);
    setEditingWorkName("");
    setEditingWorkQty(1);
    setEditingExpense({ name: "", qty: 1, rate: 0, total: 0 });
    setNewExpenseInEdit({ name: "", qty: 1, rate: 0 });
  };

  // START EDITING EXPENSE
  const startEditingExpense = (itemIndex, expenseIndex) => {
    const expense = allItems[itemIndex].materials[expenseIndex];
    setEditingItemIndex(itemIndex);
    setEditingExpenseIndex(expenseIndex);
    setAddingExpenseInEdit(false);
    setEditingExpense({
      name: expense.name,
      qty: expense.qty,
      rate: expense.rate,
      total: expense.total
    });
  };

  // SAVE EXPENSE EDIT
  const saveExpenseEdit = () => {
    if (!editingExpense.name || editingExpense.qty <= 0 || editingExpense.rate <= 0) {
      showToast("Please enter valid material details", "error");
      return;
    }

    const updatedItems = [...allItems];
    const qty = parseInt(editingExpense.qty) || 1;
    const rate = parseFloat(editingExpense.rate) || 0;
    const newTotal = qty * rate;

    updatedItems[editingItemIndex].materials[editingExpenseIndex] = {
      name: editingExpense.name,
      qty: qty,
      rate: rate,
      total: newTotal
    };

    // Recalculate expense total for the work
    updatedItems[editingItemIndex].expenseTotal =
      updatedItems[editingItemIndex].materials.reduce((sum, exp) => sum + exp.total, 0);

    setAllItems(updatedItems);
    setEditingItemIndex(null);
    setEditingExpenseIndex(null);
    setEditingExpense({ name: "", qty: 1, rate: 0, total: 0 });
    showToast("Expense updated successfully", "success");
  };

  // REMOVE ITEM
  const removeItem = (index) => {
    setAllItems(allItems.filter((_, i) => i !== index));
  };

  // REMOVE EXPENSE FROM CURRENT WORK
  const removeCurrentExpense = (index) => {
    setCurrentWorkMaterials(currentWorkMaterials.filter((_, i) => i !== index));
  };

  // REMOVE EXPENSE FROM EDIT MODE
  const removeExpenseFromEdit = (expenseIndex) => {
    const updatedItems = [...allItems];
    updatedItems[editingItemIndex].materials = updatedItems[editingItemIndex].materials.filter((_, i) => i !== expenseIndex);
    
    // Recalculate expense total
    updatedItems[editingItemIndex].expenseTotal =
      updatedItems[editingItemIndex].materials.reduce((sum, exp) => sum + exp.total, 0);
    
    setAllItems(updatedItems);
    showToast("Expense removed", "success");
  };

  // GRAND TOTAL CALCULATION - FIXED
  const calculateGrandTotal = () => {
    return allItems.reduce((sum, item) => {
      // Calculate materials total for this work
      const materialsTotal = item.materials?.reduce((matSum, mat) => {
        return matSum + (mat.total || 0);
      }, 0) || 0;
      
      // Multiply by quantity
      const workTotal = materialsTotal * (Number(item.qty) || 1);
      
      return sum + workTotal;
    }, 0);
  };

  const grandTotal = calculateGrandTotal();

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "Rs 0";
    return `Rs ${Number(amount).toFixed(2).toLocaleString('en-PK')}`;
  };

  // Format estimated amount
  const formatEstimatedAmount = (amount) => {
    if (!amount) return '';
    return `Rs ${Number(amount).toFixed(2).toLocaleString('en-PK')}`;
  };

  // Updated Print Function - uses latest data
  const printBillDirect = (billData) => {
    const profile = businessProfile;

    // Process works data - use the most up-to-date data
    const works = billData.works || allItems || [];
    
    // Calculate totals with current data
    const calculateWorkTotal = (work) => {
      const materialsTotal = work.materials?.reduce((sum, m) => sum + (m.total || 0), 0) || 0;
      return materialsTotal * (work.qty || 1);
    };

    const printGrandTotal = billData.total || grandTotal || works.reduce((sum, work) => sum + calculateWorkTotal(work), 0);

    // Professional Print Styles
    const printStyles = `
      <style>
        @page {
          size: A4;
          margin: 0.3in;
        }
        
        @media print {
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            padding: 0; 
            margin: 0; 
            background: #fff; 
            color: #1e293b;
          }
          
          .print-bill { 
            max-width: 100%;
            margin: 0 auto;
            padding: 10px;
          }
          
          /* Professional Header */
          .print-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          
          .print-business-name {
            font-size: 32px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .print-business-contact {
            display: flex;
            justify-content: center;
            gap: 25px;
            font-size: 14px;
            color: #475569;
            margin-bottom: 5px;
          }
          
          .print-business-address {
            font-size: 13px;
            color: #64748b;
            margin-top: 5px;
          }
          
          .print-title {
            text-align: center;
            margin: 15px 0;
          }
          
          .print-title h1 {
            font-size: 28px;
            color: #2563eb;
            margin: 0;
            font-weight: 700;
            letter-spacing: 1px;
          }
          
          .print-bill-details {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            padding: 10px 15px;
            border-radius: 8px;
            margin: 15px 0;
            font-size: 13px;
            font-weight: 500;
          }
          
          /* Works Section */
          .print-works {
            margin-bottom: 20px;
          }
          
          .print-works h3 {
            font-size: 18px;
            margin: 0 0 15px 0;
            color: #1e293b;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 8px;
          }
          
          .print-work {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            margin-bottom: 15px;
            padding: 15px;
          }
          
          .print-work-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          
          .print-work-name {
            font-size: 16px;
            font-weight: 600;
            color: #2563eb;
          }
          
          .print-work-qty {
            background: #f1f5f9;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: #475569;
          }
          
          /* Materials Table */
          .print-materials-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          }
          
          .print-materials-table th {
            background: #f8fafc;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            color: #475569;
            border-bottom: 2px solid #e2e8f0;
          }
          
          .print-materials-table td {
            padding: 8px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          
          .print-materials-table tr:last-child td {
            border-bottom: none;
          }
          
          .print-work-total {
            text-align: right;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 2px solid #2563eb;
            font-weight: 600;
            font-size: 14px;
          }
          
          /* Grand Total */
          .print-grand-total {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          
          .print-grand-total-label {
            font-size: 18px;
            font-weight: 600;
          }
          
          .print-grand-total-value {
            font-size: 28px;
            font-weight: 800;
            color: #fbbf24;
          }
          
          /* Footer */
          .print-footer {
            text-align: center;
            border-top: 2px solid #e2e8f0;
            padding-top: 15px;
            margin-top: 20px;
          }
          
          .print-footer-note {
            font-size: 13px;
            color: #64748b;
            font-style: italic;
            margin-bottom: 8px;
          }
          
          .print-footer-contact {
            font-size: 12px;
            color: #94a3b8;
          }
          
          .print-date {
            text-align: right;
            font-size: 10px;
            color: #94a3b8;
            margin-top: 10px;
          }
        }
      </style>
    `;

    // Generate Print HTML with updated data
    const printHTML = `
      <div class="print-bill">
        <!-- Header -->
        <div class="print-header">
          <div class="print-business-name">${profile?.shopName || 'Business Name'}</div>
          <div class="print-business-contact">
            ${profile?.phone ? `📞 ${profile.phone}` : ''}
            ${profile?.whatsapp ? `📱 ${profile.whatsapp}` : ''}
          </div>
          ${profile?.address ? `<div class="print-business-address">${profile.address}</div>` : ''}
        </div>

        <!-- Invoice Title -->
        <div class="print-title">
          <h1>INVOICE</h1>
        </div>

        <!-- Bill Details -->
        <div class="print-bill-details">
          <span><strong>Bill #:</strong> ${billData.billNumber || 'N/A'}</span>
          <span><strong>Date:</strong> ${billData.date || new Date().toLocaleDateString()}</span>
        </div>

        <!-- Customer Details -->
        <div style="background: #f8fafc; padding: 10px 15px; border-radius: 8px; margin: 15px 0; font-size: 13px;">
          <div><strong>Customer:</strong> ${billData.customer?.name || customer.name || ''}</div>
          <div><strong>Phone:</strong> ${billData.customer?.phone || customer.phone || ''}</div>
          ${(billData.customer?.address || customer.address) ? `<div><strong>Address:</strong> ${billData.customer?.address || customer.address}</div>` : ''}
        </div>

        <!-- Works Section -->
        <div class="print-works">
          <h3>WORK DETAILS</h3>
          ${works.length > 0 ? works.map((work, idx) => `
            <div class="print-work">
              <div class="print-work-header">
                <span class="print-work-name">${work.name || 'Work'}</span>
                <span class="print-work-qty">Qty: ${work.qty || 1}</span>
              </div>
              
              ${work.materials && work.materials.length > 0 ? `
                <table class="print-materials-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${work.materials.map(mat => `
                      <tr>
                        <td>${mat.name || ''}</td>
                        <td>${mat.qty || 0}</td>
                        <td>${formatCurrency(mat.rate)}</td>
                        <td>${formatCurrency(mat.total)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                
                <div class="print-work-total">
                  Work Total: ${formatCurrency(calculateWorkTotal(work))}
                </div>
              ` : '<p style="color: #64748b; font-style: italic; text-align: center;">No materials added</p>'}
            </div>
          `).join('') : '<p style="text-align: center; color: #64748b;">No works found</p>'}
        </div>

        <!-- Grand Total -->
        <div class="print-grand-total">
          <span class="print-grand-total-label">GRAND TOTAL</span>
          <span class="print-grand-total-value">${formatCurrency(printGrandTotal)}</span>
        </div>

        <!-- Estimated Amounts -->
        ${(billData.estimatedAmounts && Object.keys(billData.estimatedAmounts).length > 0) || estimatedAmounts.low || estimatedAmounts.medium || estimatedAmounts.high ? `
          <div style="background: #f8fafc; padding: 12px 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #2563eb;">
            <strong>Estimated Amounts:</strong><br>
            ${(billData.estimatedAmounts?.low || estimatedAmounts.low) ? `Low: ${formatCurrency(billData.estimatedAmounts?.low || estimatedAmounts.low)}<br>` : ''}
            ${(billData.estimatedAmounts?.medium || estimatedAmounts.medium) ? `Medium: ${formatCurrency(billData.estimatedAmounts?.medium || estimatedAmounts.medium)}<br>` : ''}
            ${(billData.estimatedAmounts?.high || estimatedAmounts.high) ? `High: ${formatCurrency(billData.estimatedAmounts?.high || estimatedAmounts.high)}` : ''}
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="print-footer">
          ${profile?.footerNote ? `<div class="print-footer-note">${profile.footerNote}</div>` : ''}
          <div class="print-footer-contact">
            ${profile?.phone ? `Phone: ${profile.phone}` : ''}
          </div>
          <div class="print-date">Printed: ${new Date().toLocaleString()}</div>
        </div>
      </div>
    `;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printStyles + printHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // SAVE COMPLETE BILL - Using API (Create or Update) with redirect
  const saveBill = async () => {
    if (!customerSaved) {
      showToast("Please save customer first!", "error");
      return;
    }
    if (allItems.length === 0) {
      showToast("Add at least one work item", "error");
      return;
    }

    try {
      setSavingBill(true);
      
      // Transform allItems to match the schema exactly with proper calculations
      const works = allItems.map(item => {
        // Ensure materials have correct totals
        const materials = (item.materials || []).map(mat => ({
          name: mat.name,
          qty: Number(mat.qty) || 1,
          rate: Number(mat.rate) || 0,
          total: (Number(mat.qty) || 1) * (Number(mat.rate) || 0)
        }));
        
        // Calculate work total
        const workTotal = materials.reduce((sum, mat) => sum + mat.total, 0);
        
        return {
          name: item.name,
          qty: Number(item.qty) || 1,
          materials: materials,
          expenseTotal: workTotal
        };
      });

      // Only include estimated amounts that have values
      const estimatedAmountsToSend = {};
      if (estimatedAmounts.low) estimatedAmountsToSend.low = Number(estimatedAmounts.low);
      if (estimatedAmounts.medium) estimatedAmountsToSend.medium = Number(estimatedAmounts.medium);
      if (estimatedAmounts.high) estimatedAmountsToSend.high = Number(estimatedAmounts.high);

      // Calculate final grand total
      const finalGrandTotal = works.reduce((sum, work) => {
        const workTotal = work.materials.reduce((matSum, mat) => matSum + mat.total, 0);
        return sum + (workTotal * work.qty);
      }, 0);

      const billData = {
        customer: customer._id || customer.id,
        works: works,
        total: finalGrandTotal,
        estimatedAmounts: estimatedAmountsToSend,
        billNumber: 'BILL-' + Math.floor(Math.random() * 10000),
        date: new Date().toLocaleString('en-PK')
      };

      console.log("Sending bill data:", billData);
      
      let response;
      // If in edit mode and we have a current job ID, update it
      if (isEditMode && currentJobId) {
        // Update the existing job
        response = await updateJob(currentJobId, billData);
        console.log("Bill updated:", response.data);
        showToast("Bill Updated Successfully", "success");
        
        // ✅ Redirect to /admin-all-customer after successful bill update
        setTimeout(() => {
          navigate('/admin-all-customer');
        }, 1500);
        
      } else {
        // Create new bill
        response = await createJob(billData);
        console.log("Bill saved:", response.data);
        showToast("Bill Saved Successfully", "success");

        // Get the saved bill data from response
        const savedBill = response.data.data || response.data;

        // Create complete bill data for overlay
        const completeBillData = {
          ...savedBill,
          works: works,
          customer: customer,
          businessProfile: businessProfile,
          total: finalGrandTotal,
          billNumber: billData.billNumber,
          date: billData.date,
          estimatedAmounts: estimatedAmountsToSend
        };

        // Refresh saved bills list
        if (customerId) {
          await fetchSavedBills(customerId);
        }

        // Load latest business profile for print
        await loadBusinessProfile();

        // Show overlay with complete data
        setSavedBillData(completeBillData);
        setShowSuccessOverlay(true);
      }

    } catch (err) {
      console.error("Error saving bill:", err);
      showToast(err.response?.data?.message || "Error saving bill", "error");
    } finally {
      setSavingBill(false);
    }
  };

  const handleCloseOverlay = () => {
    setShowSuccessOverlay(false);
    setSavedBillData(null);
  };

  // Handle closing overlay and redirect to /admin-all-customer
  const handleOverlayAndRedirect = () => {
    setShowSuccessOverlay(false);
    setSavedBillData(null);
    navigate('/admin-all-customer');
  };

  // Check if any estimated amount is filled
  const hasEstimatedAmounts = estimatedAmounts.low || estimatedAmounts.medium || estimatedAmounts.high;

  return (
    <div className="main-container-Customer">
      <div className="sidebar-wrapper-Customer">
        <Sidebar />
      </div>

      <div className="content-wrapper-Customer">
        {/* Toast Message */}
        {toast.show && (
          <div className={`toast-message-Customer ${toast.type}`}>
            <div className="toast-content-Customer">
              <span className="toast-text-Customer">{toast.message}</span>
            </div>
            <button className="toast-close-Customer" onClick={closeToast}>×</button>
          </div>
        )}

        {/* Loading indicator */}
        {(loadingCustomer || loadingJobs) && (
          <div className="loading-overlay-Customer">
            <div className="loading-spinner-Customer"></div>
            <p>Loading customer data...</p>
          </div>
        )}

        {/* Professional Success Overlay */}
        {showSuccessOverlay && savedBillData && (
          <div className="success-overlay-Customer">
            <div className="success-modal-Customer professional-success">
              <div className="success-modal-header-Customer">
                <div className="success-modal-header-Customer-main">
                  <div className="success-icon-Customer professional">
                    <FiCheckCircle />
                  </div>
                  <div className="success-title-Customer">
                    <h2>Thank You for Shopping!</h2>
                    <p>Your bill has been generated successfully</p>
                  </div>
                </div>
                <button className="close-modal-btn" onClick={handleOverlayAndRedirect}>
                  <FiX />
                </button>
              </div>

              <div className="success-modal-body-Customer">
                {/* Work Details Section */}
                {savedBillData.works && savedBillData.works.length > 0 && (
                  <div className="bill-section-Customer">
                    <h3>Work Details</h3>
                    {savedBillData.works.map((work, workIndex) => (
                      <div key={workIndex} className="saved-item-card-Customer">
                        <div className="saved-item-header-Customer">
                          <div className="work-title-with-controls">
                            <span className="work-title-Customer">
                              <strong>{work.name}</strong>
                            </span>
                            <span className="qty-display">Qty: {work.qty}</span>
                          </div>
                        </div>

                        {/* Materials Table */}
                        {work.materials && work.materials.length > 0 ? (
                          <div className="saved-expenses-Customer">
                            <small>Materials:</small>
                            <table className="bill-table-Customer">
                              <thead>
                                <tr>
                                  <th>Material</th>
                                  <th>Qty</th>
                                  <th>Rate</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {work.materials.map((mat, matIndex) => (
                                  <tr key={matIndex}>
                                    <td>{mat.name}</td>
                                    <td>{mat.qty}</td>
                                    <td>{formatCurrency(mat.rate)}</td>
                                    <td>{formatCurrency(mat.total)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            
                            {/* Work Total */}
                            <div className="work-total-display">
                              <div className="work-total-calculation">
                                <span>Materials Total: {formatCurrency(work.materials.reduce((sum, m) => sum + m.total, 0))}</span>
                                <span className="multiply-symbol">×</span>
                                <span>Quantity: {work.qty}</span>
                                <span className="equals-symbol">=</span>
                                <span className="work-grand-total">
                                  {formatCurrency(work.materials.reduce((sum, m) => sum + m.total, 0) * work.qty)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="empty-state-Customer">No materials added for this work</p>
                        )}
                      </div>
                    ))}
                    
                    {/* Grand Total in Success Modal */}
                    <div className="success-grand-total">
                      <span>GRAND TOTAL:</span>
                      <span className="success-grand-total-value">{formatCurrency(savedBillData.total || grandTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Estimated Amounts */}
                {savedBillData.estimatedAmounts && Object.keys(savedBillData.estimatedAmounts).length > 0 && (
                  <div className="bill-section-Customer">
                    <h3>Estimated Amounts</h3>
                    <div className="estimated-preview">
                      {savedBillData.estimatedAmounts.low && (
                        <p><strong>Low:</strong> {formatCurrency(savedBillData.estimatedAmounts.low)}</p>
                      )}
                      {savedBillData.estimatedAmounts.medium && (
                        <p><strong>Medium:</strong> {formatCurrency(savedBillData.estimatedAmounts.medium)}</p>
                      )}
                      {savedBillData.estimatedAmounts.high && (
                        <p><strong>High:</strong> {formatCurrency(savedBillData.estimatedAmounts.high)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="success-modal-footer-Customer">
                <button 
                  onClick={() => printBillDirect(savedBillData)} 
                  className="print-btn-Customer professional"
                >
                  <FiPrinter className="btn-icon" />
                  Print Bill
                </button>
                <button onClick={handleOverlayAndRedirect} className="ok-btn-Customer professional">
                  OK
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Saved Bills List */}
        {customerSaved && savedBills.length > 0 && isEditMode && (
          <div className="saved-bills-section">
            <h3>Previous Bills</h3>
            <div className="saved-bills-list">
              {savedBills.map((bill, index) => (
                <div key={bill._id || index} className="saved-bill-card">
                  <div className="bill-info">
                    <span className="bill-number">{bill.billNumber}</span>
                    <span className="bill-date">{bill.date}</span>
                    <span className="bill-total">{formatCurrency(bill.total)}</span>
                  </div>
                  <button 
                    onClick={() => printBillDirect(bill)} 
                    className="view-bill-btn"
                  >
                    <FiPrinter className="btn-icon" />
                    Print
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="add-customer-card-Customer">
          {/* Customer Section */}
          <div className="section-card-Customer">
            <h2 className="section-title-Customer">
              <span className="section-icon-Customer">👤</span>
              {isEditMode ? 'Edit Customer Information' : 'Customer Information'}
            </h2>
            <div className="form-grid-Customer">
              <div className="form-group-Customer">
                <label>Customer Name <span className="required-Customer">*</span></label>
                <input
                  type="text"
                  placeholder="Enter customer name"
                  value={customer.name}
                  onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  className={customerSaved ? 'disabled-input-Customer customer-name-add-customer' : 'customer-name-add-customer'}
                  disabled={customerSaved}
                />
              </div>
              <div className="form-group-Customer">
                <label>Phone Number <span className="required-Customer">*</span></label>
                <input
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  value={customer.phone}
                  onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  className={customerSaved ? 'disabled-input-Customer customer-phone-add-customer' : 'customer-phone-add-customer'}
                  disabled={customerSaved}
                />
              </div>
              <div className="form-group-Customer full-width-Customer">
                <label>Address</label>
                <input
                  type="text"
                  placeholder="Enter complete address"
                  value={customer.address}
                  onChange={e => setCustomer({ ...customer, address: e.target.value })}
                  className={customerSaved ? 'disabled-input-Customer customer-address-add-customer' : 'customer-address-add-customer'}
                  disabled={customerSaved}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={saveCustomer}
              className={`save-customer-btn-Customer ${customerSaved ? 'saved-Customer' : ''}`}
              disabled={customerSaved || savingCustomer || loadingCustomer}
            >
              {loadingCustomer ? (
                <>Loading...</>
              ) : savingCustomer ? (
                <>{isEditMode ? 'Updating...' : 'Saving...'}</>
              ) : customerSaved ? (
                <>
                  <span className="btn-icon-Customer">✓</span>
                  {isEditMode ? 'Customer Updated' : 'Customer Saved'}
                </>
              ) : (
                isEditMode ? 'Update Customer' : 'Save Customer'
              )}
            </button>
          </div>

          {/* Combined Work & Materials Section */}
          <div className="section-card-Customer">
            <h2 className="section-title-Customer">
              <span className="section-icon-Customer">🔧</span>
              Work & Materials
            </h2>

            {/* Current Work Input */}
            <div className="current-work-section-Customer">
              <div className="add-item-form-Customer">
                <div className="form-group-Customer">
                  <input
                    type="text"
                    placeholder="Work name (e.g., Painting, Plumbing)"
                    value={workName}
                    onChange={e => setWorkName(e.target.value)}
                    className="work-name-add-customer"
                    disabled={!customerSaved}
                  />
                </div>
                <div className="form-group-Customer quantity-input-Customer">
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={workQty}
                    onChange={e => setWorkQty(e.target.value)}
                    min="1"
                    className="work-quantity-add-customer"
                    disabled={!customerSaved}
                  />
                </div>
              </div>

              {/* Materials for Current Work */}
              {customerSaved && workName && (
                <div className="expenses-section-Customer">
                  <h4>Add Materials for this Work</h4>
                  <div className="add-item-form-Customer materials-form-Customer">
                    <div className="form-group-Customer">
                      <input
                        type="text"
                        placeholder="Material name"
                        value={matName}
                        onChange={e => setMatName(e.target.value)}
                        className="material-name-add-customer"
                      />
                    </div>
                    <div className="form-group-Customer">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={matQty}
                        onChange={e => setMatQty(e.target.value)}
                        min="1"
                        className="material-quantity-add-customer"
                      />
                    </div>
                    <div className="form-group-Customer">
                      <input
                        type="number"
                        placeholder="Rate (Rs)"
                        value={matRate}
                        onChange={e => setMatRate(e.target.value)}
                        min="0"
                        step="1"
                        className="material-rate-add-customer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addExpense}
                      className="add-item-btn-Customer"
                    >
                      + Add Material
                    </button>
                  </div>

                  {/* Current Materials List */}
                  {currentWorkMaterials.length > 0 && (
                    <div className="current-expenses-list-Customer">
                      <h5>Materials for this work:</h5>
                      {currentWorkMaterials.map((mat, idx) => (
                        <div key={idx} className="expense-item-Customer">
                          <span className="expense-details-Customer">
                            <span className="expense-name-Customer">{mat.name}</span>
                            <span className="expense-calculation-Customer">
                              {mat.qty} × {formatCurrency(mat.rate)} = {formatCurrency(mat.total)}
                            </span>
                          </span>
                          <button onClick={() => removeCurrentExpense(idx)} className="remove-small-Customer">×</button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save Work Button */}
                  <button
                    type="button"
                    onClick={saveWorkWithExpenses}
                    className="save-work-btn-Customer"
                    disabled={!workName}
                  >
                    Save Work with Materials
                  </button>
                </div>
              )}
            </div>

            {/* All Saved Items Display */}
            {allItems.length > 0 && (
              <div className="saved-items-list-Customer">
                <h3>All Saved Items</h3>
                {allItems.map((item, idx) => (
                  <div key={idx} className="saved-item-card-Customer">
                    {editingItemIndex === idx ? (
                      // EDIT MODE - Work being edited
                      <div className="edit-mode-container">
                        {/* Work Edit Form */}
                        <div className="edit-work-section">
                          <h4>Edit Work</h4>
                          <div className="edit-work-form">
                            <input
                              type="text"
                              value={editingWorkName}
                              onChange={(e) => setEditingWorkName(e.target.value)}
                              placeholder="Work name"
                              className="edit-work-name-add-customer"
                            />
                            <input
                              type="number"
                              value={editingWorkQty}
                              onChange={(e) => setEditingWorkQty(e.target.value)}
                              min="1"
                              placeholder="Quantity"
                              className="edit-work-quantity-add-customer"
                            />
                            <div className="edit-actions">
                              <button onClick={saveWorkEdit} className="save-edit-btn">Save Work</button>
                              <button onClick={cancelEdit} className="cancel-edit-btn">Cancel</button>
                            </div>
                          </div>
                        </div>

                        {/* Add Material Button inside Edit Mode */}
                        {!addingExpenseInEdit ? (
                          <button 
                            onClick={() => setAddingExpenseInEdit(true)} 
                            className="add-expense-in-edit-btn"
                          >
                            + Add New Material to this Work
                          </button>
                        ) : (
                          /* Add Material Form inside Edit Mode */
                          <div className="add-expense-in-edit-mode">
                            <h4>Add New Material</h4>
                            <div className="add-expense-form">
                              <input
                                type="text"
                                placeholder="Material name"
                                value={newExpenseInEdit.name}
                                onChange={(e) => setNewExpenseInEdit({ ...newExpenseInEdit, name: e.target.value })}
                                className="edit-material-name-add-customer"
                              />
                              <input
                                type="number"
                                placeholder="Quantity"
                                value={newExpenseInEdit.qty}
                                onChange={(e) => setNewExpenseInEdit({ ...newExpenseInEdit, qty: parseInt(e.target.value) || 1 })}
                                min="1"
                                className="edit-material-quantity-add-customer"
                              />
                              <input
                                type="number"
                                placeholder="Rate"
                                value={newExpenseInEdit.rate}
                                onChange={(e) => setNewExpenseInEdit({ ...newExpenseInEdit, rate: parseFloat(e.target.value) || 0 })}
                                min="0"
                                className="edit-material-rate-add-customer"
                              />
                              <div className="edit-actions">
                                <button onClick={addExpenseInEdit} className="save-edit-btn">Add Material</button>
                                <button onClick={() => setAddingExpenseInEdit(false)} className="cancel-edit-btn">Cancel</button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Display Existing Materials */}
                        {item.materials && item.materials.length > 0 && (
                          <div className="existing-expenses-section">
                            <h4>Existing Materials</h4>
                            {item.materials.map((mat, matIdx) => (
                              <div key={matIdx} className="existing-expense-item">
                                {editingExpenseIndex === matIdx ? (
                                  /* Edit Material Form */
                                  <div className="edit-expense-form">
                                    <input
                                      type="text"
                                      value={editingExpense.name}
                                      onChange={(e) => setEditingExpense({ ...editingExpense, name: e.target.value })}
                                      className="edit-existing-material-name-add-customer"
                                    />
                                    <input
                                      type="number"
                                      value={editingExpense.qty}
                                      onChange={(e) => setEditingExpense({ ...editingExpense, qty: parseInt(e.target.value) || 1 })}
                                      className="edit-existing-material-quantity-add-customer"
                                    />
                                    <input
                                      type="number"
                                      value={editingExpense.rate}
                                      onChange={(e) => setEditingExpense({ ...editingExpense, rate: parseFloat(e.target.value) || 0 })}
                                      className="edit-existing-material-rate-add-customer"
                                    />
                                    <div className="edit-actions-small">
                                      <button onClick={saveExpenseEdit} className="save-small">✓</button>
                                      <button onClick={cancelEdit} className="cancel-small">✗</button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Normal Material Display */
                                  <>
                                    <div className="expense-details">
                                      <span className="expense-name">{mat.name}</span>
                                      <span className="expense-calculation">
                                        {mat.qty} × {formatCurrency(mat.rate)} = {formatCurrency(mat.total)}
                                      </span>
                                    </div>
                                    <div className="expense-actions">
                                      <button onClick={() => startEditingExpense(idx, matIdx)} className="edit-expense-btn">✎</button>
                                      <button onClick={() => removeExpenseFromEdit(matIdx)} className="remove-expense-btn">×</button>
                                    </div>
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // NORMAL MODE
                      <>
                        <div className="saved-item-header-Customer">
                          <div className="work-title-with-controls">
                            <span className="work-title-Customer">
                              <strong>{item.name}</strong>
                            </span>
                            <div className="quantity-controls">
                              <button
                                onClick={() => decreaseQuantity(idx)}
                                className="qty-btn minus"
                                title="Decrease quantity"
                              >−</button>
                              <span className="qty-display">{item.qty}</span>
                              <button
                                onClick={() => increaseQuantity(idx)}
                                className="qty-btn plus"
                                title="Increase quantity"
                              >+</button>
                            </div>
                          </div>
                          <div className="item-actions">
                            <button onClick={() => startEditingWork(idx)} className="edit-item-btn" title="Edit work">✎</button>
                            <button onClick={() => removeItem(idx)} className="remove-item-Customer" title="Remove item">×</button>
                          </div>
                        </div>

                        {/* Display Materials */}
                        {item.materials && item.materials.length > 0 && (
                          <div className="saved-expenses-Customer">
                            <small>Materials:</small>
                            {item.materials.map((mat, matIdx) => (
                              <div key={matIdx} className="saved-expense-Customer">
                                <div className="expense-info">
                                  <span className="expense-name-Customer">{mat.name}</span>
                                  <span className="expense-calculation-Customer">
                                    {mat.qty} × {formatCurrency(mat.rate)} = {formatCurrency(mat.total)}
                                  </span>
                                </div>
                                <span className="expense-total-mini">{formatCurrency(mat.total)}</span>
                              </div>
                            ))}
                            
                            {/* Work Total Display */}
                            <div className="work-total-display">
                              <div className="work-total-calculation">
                                <span>Materials Total: {formatCurrency(item.expenseTotal)}</span>
                                <span className="multiply-symbol">×</span>
                                <span>Quantity: {item.qty}</span>
                                <span className="equals-symbol">=</span>
                                <span className="work-grand-total">{formatCurrency(item.expenseTotal * item.qty)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grand Total Card */}
          <div className="grand-total-card-Customer">
            <div className="grand-total-content-Customer">
              <span className="grand-total-label-Customer">Grand Total (All Works)</span>
              <span className="grand-total-amount-Customer">{formatCurrency(grandTotal)}</span>
            </div>
            {allItems.length > 0 && (
              <div className="total-breakdown-Customer">
                <span>Total Works: {allItems.length}</span>
                <span>Total Quantity: {allItems.reduce((sum, item) => sum + item.qty, 0)}</span>
              </div>
            )}
          </div>
         
          {/* Estimated Amounts Section */}
          <div className="section-card-Customer">
            <h2 className="section-title-Customer">
              <span className="section-icon-Customer">💰</span>
              Estimated Costs
            </h2>
            <div className="estimated-amounts-grid">
              <div className="form-group-Customer">
                <label>Low Estimate (Rs)</label>
                <input
                  type="number"
                  placeholder="Enter low estimate"
                  value={estimatedAmounts.low}
                  onChange={e => setEstimatedAmounts({ ...estimatedAmounts, low: e.target.value })}
                  min="0"
                  step="1000"
                  className="estimated-low-add-customer"
                  disabled={!customerSaved}
                />
              </div>
              <div className="form-group-Customer">
                <label>Medium Estimate (Rs)</label>
                <input
                  type="number"
                  placeholder="Enter medium estimate"
                  value={estimatedAmounts.medium}
                  onChange={e => setEstimatedAmounts({ ...estimatedAmounts, medium: e.target.value })}
                  min="0"
                  step="1000"
                  className="estimated-medium-add-customer"
                  disabled={!customerSaved}
                />
              </div>
              <div className="form-group-Customer">
                <label>High Estimate (Rs)</label>
                <input
                  type="number"
                  placeholder="Enter high estimate"
                  value={estimatedAmounts.high}
                  onChange={e => setEstimatedAmounts({ ...estimatedAmounts, high: e.target.value })}
                  min="0"
                  step="1000"
                  className="estimated-high-add-customer"
                  disabled={!customerSaved}
                />
              </div>
            </div>
            {hasEstimatedAmounts && (
              <div className="estimated-summary">
                <p className="estimated-note">
                  <span className="estimated-dot low"></span> Low: {formatEstimatedAmount(estimatedAmounts.low)}
                </p>
                <p className="estimated-note">
                  <span className="estimated-dot medium"></span> Medium: {formatEstimatedAmount(estimatedAmounts.medium)}
                </p>
                <p className="estimated-note">
                  <span className="estimated-dot high"></span> High: {formatEstimatedAmount(estimatedAmounts.high)}
                </p>
              </div>
            )}
          </div>
          
          {/* Save All Button */}
          <button
            type="button"
            onClick={saveBill}
            className="save-bill-btn-Customer"
            disabled={!customerSaved || allItems.length === 0 || savingBill}
          >
            {savingBill ? (
              isEditMode ? "Updating Bill..." : "Saving Bill..."
            ) : (
              isEditMode ? "Update Complete Bill" : "Save Complete Bill"
            )}
          </button>

          {/* Customer not saved warning */}
          {!customerSaved && (
            <div className="warning-message-Customer">
              ⚠️ Please save customer information first to add items
            </div>
          )}
        </div>
      </div>
    </div>
  );
}