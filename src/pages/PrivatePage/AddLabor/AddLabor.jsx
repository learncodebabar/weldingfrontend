import React, { useState } from 'react';
import laborService from '../../../api/laborService';
import './AddLabor.css';
import Sidebar from '../../../components/Sidebar/Sidebar';

const AddLabor = ({ onLaborAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    fatherName: '',
    cnic: '',
    mobile: '',
    paymentType: 'Per Day', 
    perDayRate: '',
    designation: 'Labor',
    joiningDate: new Date().toISOString().split('T')[0],
    presentAddress: '',
    city: 'Lahore',
    employmentStatus: 'Active'
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState({});

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

  // Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: ''
      });
    }
  };

  // CNIC Format
  const formatCNIC = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 5) return numbers;
    if (numbers.length <= 12) return `${numbers.slice(0, 5)}-${numbers.slice(5)}`;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 12)}-${numbers.slice(12)}`;
  };

  const handleCNICChange = (e) => {
    const formatted = formatCNIC(e.target.value);
    setFormData({ ...formData, cnic: formatted });
    if (fieldErrors.cnic) setFieldErrors({ ...fieldErrors, cnic: '' });
  };

  // Mobile Format
  const formatMobile = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 4) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 4)}-${numbers.slice(4)}`;
    if (numbers.length <= 10) return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}-${numbers.slice(7)}`;
    return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}-${numbers.slice(7, 10)}-${numbers.slice(10)}`;
  };

  const handleMobileChange = (e) => {
    const formatted = formatMobile(e.target.value);
    setFormData({ ...formData, mobile: formatted });
    if (fieldErrors.mobile) setFieldErrors({ ...fieldErrors, mobile: '' });
  };

  // Validate Form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.fatherName.trim()) errors.fatherName = 'Father\'s name is required';
    if (!formData.cnic.trim()) errors.cnic = 'CNIC is required';
    if (!formData.mobile.trim()) errors.mobile = 'Mobile number is required';
    
    // Per Day Rate is required
    if (!formData.perDayRate || parseFloat(formData.perDayRate) <= 0) {
      errors.perDayRate = 'Valid per day rate is required';
    }
    
    return errors;
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('error', 'Please fix the errors in the form');
      return;
    }

    setLoading(true);

    // Prepare data - only per day rate
    const submitData = {
      name: formData.name,
      fatherName: formData.fatherName,
      cnic: formData.cnic,
      mobile: formData.mobile,
      paymentType: 'Per Day',
      perDayRate: parseFloat(formData.perDayRate),
      monthlySalary: 0, // Zero for per day workers
      designation: formData.designation,
      joiningDate: formData.joiningDate,
      presentAddress: formData.presentAddress,
      city: formData.city,
      employmentStatus: formData.employmentStatus
    };

    console.log('Submitting data:', submitData);

    try {
      const response = await laborService.addLabor(submitData);
      
      showToast('success', response.message || 'Labor added successfully!');

      // Reset form
      setFormData({
        name: '',
        fatherName: '',
        cnic: '',
        mobile: '',
        paymentType: 'Per Day',
        perDayRate: '',
        designation: 'Labor',
        joiningDate: new Date().toISOString().split('T')[0],
        presentAddress: '',
        city: 'Lahore',
        employmentStatus: 'Active'
      });
      setFieldErrors({});

      if (onLaborAdded) onLaborAdded(response);

    } catch (error) {
      console.error('Error:', error);
      
      if (typeof error === 'object') {
        showToast('error', error.message || 'Something went wrong');
        if (error.errors) setFieldErrors(error.errors);
      } else {
        showToast('error', 'Cannot connect to server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-labor-container  sideber-container-Mobile">
      <Sidebar />
      
      <div className="add-labor-content">
        {/* Toast Message */}
        {toast.show && (
          <div className={`add-labor-toast ${toast.type}`}>
            <div className="add-labor-toast-content">
              <span>{toast.message}</span>
            </div>
            <button className="add-labor-toast-close" onClick={hideToast}>
              ×
            </button>
          </div>
        )}

        <div className="add-labor-form-container">
          <div className="add-labor-form-header">
            <h2>Add New Labor</h2>
            <p>Fill in the labor details below</p>
          </div>

          <form onSubmit={handleSubmit} className="add-labor-form">
            <div className="add-labor-form-row">
              <div className="add-labor-form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={fieldErrors.name ? 'error' : ''}
                  placeholder="Enter full name"
                />
                {fieldErrors.name && <small className="add-labor-error-text">{fieldErrors.name}</small>}
              </div>

              <div className="add-labor-form-group">
                <label>Father's Name *</label>
                <input
                  type="text"
                  name="fatherName"
                  value={formData.fatherName}
                  onChange={handleChange}
                  className={fieldErrors.fatherName ? 'error' : ''}
                  placeholder="Enter father's name"
                />
                {fieldErrors.fatherName && <small className="add-labor-error-text">{fieldErrors.fatherName}</small>}
              </div>
            </div>

            <div className="add-labor-form-row">
              <div className="add-labor-form-group">
                <label>CNIC Number *</label>
                <input
                  type="text"
                  name="cnic"
                  value={formData.cnic}
                  onChange={handleCNICChange}
                  className={fieldErrors.cnic ? 'error' : ''}
                  placeholder="Enter CNIC number"
                />
                <small>No length restriction</small>
                {fieldErrors.cnic && <small className="add-labor-error-text">{fieldErrors.cnic}</small>}
              </div>

              <div className="add-labor-form-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleMobileChange}
                  className={fieldErrors.mobile ? 'error' : ''}
                  placeholder="Enter mobile number"
                />
                <small>No length restriction</small>
                {fieldErrors.mobile && <small className="add-labor-error-text">{fieldErrors.mobile}</small>}
              </div>
            </div>

            {/* Per Day Rate Field */}
            <div className="add-labor-form-row">
              <div className="add-labor-form-group add-labor-full-width">
                <label>Per Day Rate (PKR) *</label>
                <input
                  type="number"
                  name="perDayRate"
                  value={formData.perDayRate}
                  onChange={handleChange}
                  className={fieldErrors.perDayRate ? 'error' : ''}
                  min="0"
                  step="100"
                  placeholder="Enter per day rate"
                />
                <small>You can add any amount per day</small>
                {fieldErrors.perDayRate && <small className="add-labor-error-text">{fieldErrors.perDayRate}</small>}
              </div>
            </div>

            <div className="add-labor-form-row">
              <div className="add-labor-form-group">
                <label>Designation</label>
                <select name="designation" value={formData.designation} onChange={handleChange}>
                  <option value="Labor">Labor</option>
                  <option value="Loader">Loader</option>
                  <option value="Driver">Driver</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="add-labor-form-group">
                <label>Joining Date</label>
                <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
              </div>
            </div>

            <div className="add-labor-form-row">
              <div className="add-labor-form-group">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Enter city" />
              </div>

              <div className="add-labor-form-group">
                <label>Status</label>
                <select name="employmentStatus" value={formData.employmentStatus} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                </select>
              </div>
            </div>

            <div className="add-labor-form-group add-labor-full-width">
              <label>Present Address</label>
              <textarea name="presentAddress" value={formData.presentAddress} onChange={handleChange} rows="3" placeholder="Enter complete address" />
            </div>

            <div className="add-labor-form-actions">
              <button type="submit" className="add-labor-submit-btn" disabled={loading}>
                {loading ? <>Please wait...</> : <>Add Labor</>}
              </button>
              
              <button type="button" className="add-labor-reset-btn" onClick={() => {
                setFormData({
                  name: '', fatherName: '', cnic: '', mobile: '', paymentType: 'Per Day',
                  perDayRate: '', designation: 'Labor',
                  joiningDate: new Date().toISOString().split('T')[0],
                  presentAddress: '', city: 'Lahore', employmentStatus: 'Active'
                });
                setFieldErrors({});
              }}>
                Reset Form
              </button>
            </div>
          </form>

          <div className="add-labor-info-box">
            <h4>Payment Information:</h4>
            <p>✓ Per day worker: You can add any amount per day. No restrictions!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddLabor;