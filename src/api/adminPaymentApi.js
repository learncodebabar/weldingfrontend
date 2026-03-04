import API from './axios';

// ========== ADMIN PAYMENT API FUNCTIONS ==========

/**
 * Get all admin payments with filters
 */
export const getAllAdminPayments = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await API.get(`/admin/payments${queryParams ? `?${queryParams}` : ''}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    throw error;
  }
};

/**
 * Create a new admin payment (manual payment entry - NOT linked to any order)
 */
export const createAdminPayment = async (paymentData) => {
  try {
    const response = await API.post('/admin/payments', paymentData);
    return response.data;
  } catch (error) {
    console.error('Error creating admin payment:', error);
    throw error;
  }
};

/**
 * Get single admin payment by ID
 */
export const getAdminPaymentById = async (id) => {
  try {
    const response = await API.get(`/admin/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching admin payment:', error);
    throw error;
  }
};

/**
 * Update admin payment
 */
export const updateAdminPayment = async (id, paymentData) => {
  try {
    const response = await API.put(`/admin/payments/${id}`, paymentData);
    return response.data;
  } catch (error) {
    console.error('Error updating admin payment:', error);
    throw error;
  }
};

/**
 * Delete admin payment
 */
export const deleteAdminPayment = async (id) => {
  try {
    const response = await API.delete(`/admin/payments/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting admin payment:', error);
    throw error;
  }
};