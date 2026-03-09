import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import laborService from '../../../api/laborService';
import attendanceService from '../../../api/attendanceService';
import paymentService from '../../../api/paymentService';
import Sidebar from '../../../components/Sidebar/Sidebar';
import './WorkerDetailsPage.css';

// React Icons
import {
  FaUserCircle, FaCalendarAlt, FaArrowLeft,
  FaCheckCircle, FaRupeeSign, FaMoneyBillWave,
  FaIdCard, FaPhone, FaExclamationTriangle,
  FaPlusCircle, FaTimes, FaWallet, FaHistory,
  FaClock, FaFilePdf, FaPrint, FaFileExport,
  FaDownload, FaCheck, FaExclamationCircle
} from 'react-icons/fa';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const WorkerDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Refs for PDF/Print
  const profileRef = useRef(null);
  const attendanceRef = useRef(null);
  const paymentsRef = useRef(null);

  console.log('URL ID:', id);

  const [worker, setWorker] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Toast State
  const [toast, setToast] = useState({ show: false, type: '', message: '' });

  // Payment Modal State
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Cash');
  const [processing, setProcessing] = useState(false);

  // Validate MongoDB ID format
  const isValidMongoId = (id) => {
    return id && id.length === 24 && /^[0-9a-fA-F]{24}$/.test(id);
  };

  // Show toast message
  const showToast = (type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast({ show: false, type: '', message: '' });
    }, 3000);
  };

  // Hide toast
  const hideToast = () => {
    setToast({ show: false, type: '', message: '' });
  };

  useEffect(() => {
    if (!id) {
      showToast('error', 'No worker ID provided');
      setLoading(false);
      return;
    }

    if (!isValidMongoId(id)) {
      showToast('error', 'Invalid worker ID format');
      setLoading(false);
      console.error('Invalid MongoDB ID:', id);
      return;
    }

    fetchWorkerDetails();
    fetchPaymentHistory();
  }, [id]);

  useEffect(() => {
    if (worker && id && isValidMongoId(id)) {
      fetchWorkerAttendance();
    }
  }, [selectedMonth, selectedYear, worker, id]);

  useEffect(() => {
    if (worker && id && isValidMongoId(id)) {
      fetchPaymentHistory();
    }
  }, [selectedMonth, selectedYear]);

  const fetchWorkerDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching worker with ID:', id);
      const response = await laborService.getLaborById(id);
      console.log('Worker response:', response);
      setWorker(response.labor);
    } catch (err) {
      console.error('Failed to fetch worker details:', err);
      showToast('error', err.message || 'Failed to fetch worker details');
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerAttendance = async () => {
    try {
      console.log('Fetching attendance for worker:', id, 'Month:', selectedMonth, 'Year:', selectedYear);
      const response = await attendanceService.getAttendanceByLabor(id, selectedMonth, selectedYear);
      setAttendance(response.attendance || []);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      showToast('error', 'Failed to fetch attendance data');
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      console.log('Fetching payments for labor:', id, 'Month:', selectedMonth, 'Year:', selectedYear);
      const response = await paymentService.getPaymentsByLabor(id, {
        month: selectedMonth,
        year: selectedYear
      });
      setPayments(response.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      showToast('error', 'Failed to fetch payment history');
    }
  };

  // ==================== Calculations ====================

  // Updated to handle Half Day as 0.5 day
  const presentDaysCount = attendance.filter(a => a.status === 'Present').length;
  const halfDaysCount = attendance.filter(a => a.status === 'Half Day').length;
  
  // Calculate total days with half days counting as 0.5
  const totalEffectiveDays = presentDaysCount + (halfDaysCount * 0.5);
  const totalEarnings = totalEffectiveDays * (worker?.perDayRate || 0);
  
  // Payment calculations
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingPayment = totalEarnings - totalPaid;
  const paymentPercentage = totalEarnings > 0 ? (totalPaid / totalEarnings) * 100 : 0;

  // Attendance stats
  const attendanceStats = {
    present: presentDaysCount,
    halfDay: halfDaysCount,
    absent: attendance.filter(a => a.status === 'Absent').length,
    leave: attendance.filter(a => a.status === 'Leave').length,
    overtime: attendance.filter(a => a.status === 'Overtime').length,
    total: attendance.length
  };

  // ==================== Payment Functions ====================

  const handleAddPayment = async () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      showToast('error', 'Please enter a valid amount');
      return;
    }

    const amt = parseFloat(amount);
    
    // Check if amount exceeds remaining balance
    if (amt > remainingPayment) {
      showToast('error', `Payment amount cannot exceed remaining balance. Remaining: Rs. ${remainingPayment.toLocaleString()}`);
      return;
    }

    try {
      setProcessing(true);

      const paymentData = {
        laborId: id,
        amount: amt,
        method: method,
        note: `Payment for ${months[selectedMonth - 1]} ${selectedYear}`,
        month: selectedMonth,
        year: selectedYear,
        date: new Date().toISOString()
      };

      console.log('Sending payment data:', paymentData);
      
      const response = await paymentService.addPayment(paymentData);
      
      console.log('Payment response:', response);
      
      // Success toast
      showToast('success', 'Payment added successfully!');
      
      // Refresh payment history
      await fetchPaymentHistory();
      
      // Reset and close modal
      setAmount('');
      setMethod('Cash');
      setShowModal(false);
      
    } catch (err) {
      console.error('Failed to add payment:', err);
      
      if (err.message) {
        showToast('error', err.message);
      } else {
        showToast('error', 'Failed to add payment. Please try again');
      }
    } finally {
      setProcessing(false);
    }
  };

  // ==================== Export Functions ====================

  // Export to PDF
  const exportToPDF = async (elementRef, fileName, title) => {
    if (!elementRef.current) return;

    try {
      const element = elementRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        useCORS: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${fileName}_${new Date().toISOString().split('T')[0]}.pdf`);

      showToast('success', `${title} exported successfully!`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      showToast('error', 'Failed to export to PDF. Please try again.');
    }
  };

  // Print function
  const handlePrint = (elementRef, title) => {
    if (!elementRef.current) return;

    const printWindow = window.open('', '_blank');
    const elementContent = elementRef.current.outerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          ${elementContent}
          <p style="margin-top: 20px;">Generated on: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    showToast('success', 'Print job sent successfully');
  };

  // Export Attendance as CSV
  const exportAttendanceAsCSV = () => {
    if (attendance.length === 0) {
      showToast('error', 'No attendance data to export');
      return;
    }

    const headers = ['Date', 'Status'];
    const rows = attendance.map(record => [
      new Date(record.date).toLocaleDateString(),
      record.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${worker?.name}_${months[selectedMonth - 1]}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'Attendance data exported successfully');
  };

  // Export Payments as CSV
  const exportPaymentsAsCSV = () => {
    if (payments.length === 0) {
      showToast('error', 'No payment data to export');
      return;
    }

    const headers = ['Date', 'Amount', 'Method', 'Note'];
    const rows = payments.map(payment => [
      new Date(payment.date).toLocaleDateString(),
      payment.amount,
      payment.method,
      payment.note || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `payments_${worker?.name}_${months[selectedMonth - 1]}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('success', 'Payment data exported successfully');
  };

  // ==================== Modal Component ====================

  const PaymentModal = () => {
    return (
      <div 
        className="worker-details-page-modal-overlay" 
        onClick={(e) => {
          if (e.target === e.currentTarget && !processing) {
            setShowModal(false);
          }
        }}
      >
        <div 
          className="worker-details-page-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="worker-details-page-modal-header">
            <h3>
              <FaWallet /> Add New Payment
            </h3>
            <button 
              type="button"
              className="worker-details-page-modal-close" 
              onClick={() => !processing && setShowModal(false)}
              disabled={processing}
            >
              <FaTimes />
            </button>
          </div>

          <div className="worker-details-page-modal-body">
            {/* Payment Summary */}
            <div className="worker-details-page-payment-summary">
              <div className="worker-details-page-summary-item">
                <span className="worker-details-page-label">Total Earnings:</span>
                <span className="worker-details-page-value">Rs. {totalEarnings.toLocaleString()}</span>
              </div>
              <div className="worker-details-page-summary-item">
                <span className="worker-details-page-label">Total Paid:</span>
                <span className="worker-details-page-value">Rs. {totalPaid.toLocaleString()}</span>
              </div>
              <div className="worker-details-page-summary-item worker-details-page-remaining">
                <span className="worker-details-page-label">Remaining:</span>
                <span className="worker-details-page-value">Rs. {remainingPayment.toLocaleString()}</span>
              </div>
            </div>

            {/* Month Info */}
            <div className="worker-details-page-month-info">
              <FaCalendarAlt /> Payment for {months[selectedMonth - 1]} {selectedYear}
            </div>

            {/* Amount Input */}
            <div className="worker-details-page-form-group">
              <label>
                <FaRupeeSign /> Amount (Rs.) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  e.stopPropagation();
                  setAmount(e.target.value);
                }}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Enter amount"
                max={remainingPayment}
                min="1"
                step="100"
                required
                autoFocus
                disabled={processing}
              />
              {remainingPayment > 0 && (
                <small>Maximum: Rs. {remainingPayment.toLocaleString()}</small>
              )}
            </div>

            {/* Payment Method */}
            <div className="worker-details-page-form-group">
              <label>
                <FaMoneyBillWave /> Payment Method
              </label>
              <select
                value={method}
                onChange={(e) => {
                  e.stopPropagation();
                  setMethod(e.target.value);
                }}
                disabled={processing}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Online Payment">Online Payment</option>
              </select>
            </div>
          </div>

          <div className="worker-details-page-modal-footer">
            <button 
              type="button"
              className="worker-details-page-cancel-btn"
              onClick={() => !processing && setShowModal(false)}
              disabled={processing}
            >
              Cancel
            </button>
            <button 
              type="button"
              className="worker-details-page-submit-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleAddPayment();
              }}
              disabled={processing || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > remainingPayment}
            >
              {processing ? 'Processing...' : 'Add Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Months and Years arrays
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Invalid ID state
  if (!isValidMongoId(id)) {
    return (
      <div className="worker-details-page">
        <Sidebar />
        <div className="worker-details-page-content">
          <div className="worker-details-page-error-state">
            <FaExclamationTriangle size={50} />
            <h3>Invalid Worker ID</h3>
            <p>The worker ID format is incorrect</p>
            <p className="worker-details-page-error-details">ID: {id}</p>
            <button onClick={() => navigate('/All-Labor')} className="worker-details-page-back-btn">
              <FaArrowLeft /> Back to Workers
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="worker-details-page">
        <Sidebar />
        <div className="worker-details-page-content">
          <div className="worker-details-page-loading-state">
            <div className="worker-details-page-loading-spinner"></div>
            <p>Loading worker details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="worker-details-page">
        <Sidebar />
        <div className="worker-details-page-content">
          <div className="worker-details-page-error-state">
            <FaExclamationTriangle size={50} />
            <h3>Error</h3>
            <p>{error || 'Worker not found'}</p>
            <button onClick={() => navigate('/All-Labor')} className="worker-details-page-back-btn">
              <FaArrowLeft /> Back to Workers
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="worker-details-page sideber-container-Mobile">
      <Sidebar />
      
      <div className="worker-details-page-content">
        {/* Toast Message */}
        {toast.show && (
          <div className={`worker-details-page-toast ${toast.type}`}>
            <div className="worker-details-page-toast-content">
              {toast.type === 'success' ? <FaCheckCircle /> : <FaExclamationCircle />}
              <span>{toast.message}</span>
            </div>
            <button className="worker-details-page-toast-close" onClick={hideToast}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* Header with Add Payment Button */}
        <div className="worker-details-page-header">
          <div className="worker-details-page-header-left">
            <button className="worker-details-page-back-btn" onClick={() => navigate('/All-Labor')}>
              <FaArrowLeft /> Back
            </button>
            <h1>
              <FaUserCircle /> Worker Details
            </h1>
          </div>
          <button 
            className="worker-details-page-payment-btn"
            onClick={() => setShowModal(true)}
          >
            <FaPlusCircle /> Add Payment
          </button>
        </div>

        {/* Worker Profile - with ref for PDF/Print */}
        <div ref={profileRef} className="worker-details-page-profile-card">
          <div className="worker-details-page-profile-avatar">
            {worker.name?.charAt(0).toUpperCase()}
          </div>
          <div className="worker-details-page-profile-info">
            <h2>{worker.name}</h2>
            <div className="worker-details-page-profile-details">
              <span><FaIdCard /> {worker.cnic}</span>
              <span><FaPhone /> {worker.mobile}</span>
            </div>
          </div>
          <div className="worker-details-page-profile-rate">
            <span className="worker-details-page-rate-label">Per Day Rate</span>
            <span className="worker-details-page-rate-value">Rs. {worker.perDayRate?.toLocaleString()}</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="worker-details-page-export-buttons">
          <button 
            className="worker-details-page-export-btn pdf"
            onClick={() => exportToPDF(profileRef, `worker_${worker.name}`, 'Worker Profile')}
            title="Export Profile to PDF"
          >
            <FaFilePdf /> Profile PDF
          </button>
          <button 
            className="worker-details-page-export-btn print"
            onClick={() => handlePrint(profileRef, 'Worker Profile')}
            title="Print Profile"
          >
            <FaPrint /> Print Profile
          </button>
          <button 
            className="worker-details-page-export-btn csv"
            onClick={exportAttendanceAsCSV}
            title="Export Attendance to CSV"
          >
            <FaFileExport /> Attendance CSV
          </button>
          <button 
            className="worker-details-page-export-btn csv"
            onClick={exportPaymentsAsCSV}
            title="Export Payments to CSV"
          >
            <FaDownload /> Payments CSV
          </button>
        </div>

        {/* Payment Statistics Cards */}
        <div className="worker-details-page-stats-grid">
          <div className="worker-details-page-stat-card worker-details-page-total">
            <div className="worker-details-page-stat-icon">
              <FaRupeeSign />
            </div>
            <div className="worker-details-page-stat-info">
              <span className="worker-details-page-stat-label">Total Earnings</span>
              <span className="worker-details-page-stat-value">Rs. {totalEarnings.toLocaleString()}</span>
            </div>
          </div>

          <div className="worker-details-page-stat-card worker-details-page-paid">
            <div className="worker-details-page-stat-icon">
              <FaMoneyBillWave />
            </div>
            <div className="worker-details-page-stat-info">
              <span className="worker-details-page-stat-label">Total Paid</span>
              <span className="worker-details-page-stat-value">Rs. {totalPaid.toLocaleString()}</span>
            </div>
          </div>

          <div className="worker-details-page-stat-card worker-details-page-remaining-stat">
            <div className="worker-details-page-stat-icon">
              <FaClock />
            </div>
            <div className="worker-details-page-stat-info">
              <span className="worker-details-page-stat-label">Remaining</span>
              <span className="worker-details-page-stat-value">Rs. {remainingPayment.toLocaleString()}</span>
            </div>
          </div>

          <div className="worker-details-page-stat-card worker-details-page-attendance-stat">
            <div className="worker-details-page-stat-icon">
              <FaCheckCircle />
            </div>
            <div className="worker-details-page-stat-info">
              <span className="worker-details-page-stat-label">Present Days</span>
              <span className="worker-details-page-stat-value">{presentDaysCount} Days</span>
            </div>
          </div>
        </div>

        {/* Attendance Stats Summary */}
        <div className="worker-details-page-attendance-stats">
          <h4>Attendance Summary</h4>
          <div className="worker-details-page-attendance-stats-grid">
            <div className="worker-details-page-attendance-stat-item">
              <span className="label">Present:</span>
              <span className="value present">{attendanceStats.present}</span>
            </div>
            <div className="worker-details-page-attendance-stat-item">
              <span className="label">Half Day:</span>
              <span className="value halfday">{attendanceStats.halfDay}</span>
            </div>
            <div className="worker-details-page-attendance-stat-item">
              <span className="label">Absent:</span>
              <span className="value absent">{attendanceStats.absent}</span>
            </div>
            <div className="worker-details-page-attendance-stat-item">
              <span className="label">Leave:</span>
              <span className="value leave">{attendanceStats.leave}</span>
            </div>
            <div className="worker-details-page-attendance-stat-item">
              <span className="label">Overtime:</span>
              <span className="value overtime">{attendanceStats.overtime}</span>
            </div>
            <div className="worker-details-page-attendance-stat-item">
              <span className="label">Total:</span>
              <span className="value total">{attendanceStats.total}</span>
            </div>
          </div>
        </div>

        {/* Payment Progress Bar */}
        {totalEarnings > 0 && (
          <div className="worker-details-page-payment-progress">
            <div className="worker-details-page-progress-header">
              <span>Payment Progress</span>
              <span>{paymentPercentage.toFixed(1)}% Complete</span>
            </div>
            <div className="worker-details-page-progress-bar">
              <div 
                className="worker-details-page-progress-fill"
                style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Month Selector */}
        <div className="worker-details-page-month-selector">
          <label>Month:</label>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
            {months.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          
          <label>Year:</label>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Salary Card */}
        <div className="worker-details-page-salary-card">
          <h3>{months[selectedMonth - 1]} {selectedYear} - Salary Details</h3>
          
          <div className="worker-details-page-salary-row">
            <span className="worker-details-page-label"><FaCheckCircle /> Present Days:</span>
            <span className="worker-details-page-value">{presentDaysCount} days</span>
          </div>

          <div className="worker-details-page-salary-row">
            <span className="worker-details-page-label"><FaCheckCircle /> Half Days:</span>
            <span className="worker-details-page-value">{halfDaysCount} days (counts as 0.5 each)</span>
          </div>

          <div className="worker-details-page-salary-row">
            <span className="worker-details-page-label"><FaCheckCircle /> Effective Days:</span>
            <span className="worker-details-page-value">{totalEffectiveDays.toFixed(1)} days</span>
          </div>

          <div className="worker-details-page-salary-row">
            <span className="worker-details-page-label"><FaRupeeSign /> Per Day Rate:</span>
            <span className="worker-details-page-value">Rs. {worker.perDayRate?.toLocaleString()}</span>
          </div>

          <div className="worker-details-page-salary-row worker-details-page-total">
            <span className="worker-details-page-label">Total Monthly Salary:</span>
            <span className="worker-details-page-value worker-details-page-highlight">
              <FaMoneyBillWave /> Rs. {totalEarnings.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Payment History - with ref for PDF/Print */}
        <div ref={paymentsRef} className="worker-details-page-payment-history">
          <div className="worker-details-page-section-header">
            <h4>
              <FaHistory /> Payment History - {months[selectedMonth - 1]} {selectedYear}
            </h4>
            <div className="worker-details-page-section-actions">
              <button 
                className="worker-details-page-small-export-btn pdf"
                onClick={() => exportToPDF(paymentsRef, `payments_${worker.name}_${months[selectedMonth - 1]}_${selectedYear}`, 'Payment History')}
                title="Export Payments to PDF"
              >
                <FaFilePdf />
              </button>
              <button 
                className="worker-details-page-small-export-btn print"
                onClick={() => handlePrint(paymentsRef, 'Payment History')}
                title="Print Payments"
              >
                <FaPrint />
              </button>
              <button 
                className="worker-details-page-small-export-btn csv"
                onClick={exportPaymentsAsCSV}
                title="Export Payments to CSV"
              >
                <FaDownload />
              </button>
            </div>
          </div>
          {payments.length === 0 ? (
            <p className="worker-details-page-no-data">No payment records for this month</p>
          ) : (
            <ul>
              {payments.map((payment, index) => (
                <li key={payment._id || index}>
                  <div className="worker-details-page-payment-info">
                    <span className="worker-details-page-payment-date">
                      {new Date(payment.date).toLocaleDateString()}
                    </span>
                    <span className="worker-details-page-payment-method">
                      {payment.method}
                    </span>
                  </div>
                  <div className="worker-details-page-payment-amount">
                    Rs. {payment.amount.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Attendance List - with ref for PDF/Print */}
        <div ref={attendanceRef} className="worker-details-page-attendance-list">
          <div className="worker-details-page-section-header">
            <h4>Attendance Details</h4>
            <div className="worker-details-page-section-actions">
              <button 
                className="worker-details-page-small-export-btn pdf"
                onClick={() => exportToPDF(attendanceRef, `attendance_${worker.name}_${months[selectedMonth - 1]}_${selectedYear}`, 'Attendance Details')}
                title="Export Attendance to PDF"
              >
                <FaFilePdf />
              </button>
              <button 
                className="worker-details-page-small-export-btn print"
                onClick={() => handlePrint(attendanceRef, 'Attendance Details')}
                title="Print Attendance"
              >
                <FaPrint />
              </button>
              <button 
                className="worker-details-page-small-export-btn csv"
                onClick={exportAttendanceAsCSV}
                title="Export Attendance to CSV"
              >
                <FaDownload />
              </button>
            </div>
          </div>
          {attendance.length === 0 ? (
            <p className="worker-details-page-no-data">No attendance records for this month</p>
          ) : (
            <ul>
              {attendance.map((record, index) => (
                <li key={index}>
                  <span>{new Date(record.date).toLocaleDateString()}</span>
                  <span className={`worker-details-page-status-badge ${record.status.toLowerCase().replace(' ', '-')}`}>
                    {record.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showModal && <PaymentModal />}
    </div>
  );
};

export default WorkerDetailsPage;