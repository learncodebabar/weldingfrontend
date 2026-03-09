import API from "./axios";  // آپ کے بنائے ہوئے axios instance کو import کریں

// Helper to get token
const getToken = () => localStorage.getItem("adminToken");

// ============ CUSTOMER APIS ============

// Get single customer by ID
export const getCustomerById = (id) => {
  return API.get(`/customers/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
};

// Get all jobs for a customer
export const getCustomerJobs = (customerId) => {
  return API.get(`/jobs/customer/${customerId}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
};

// Create new customer
export const createCustomer = (data) => {
  return API.post(`/customers`, data, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
};

// Update customer
export const updateCustomer = (id, data) => {
  return API.put(`/customers/${id}`, data, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
};

// Delete customer
export const deleteCustomer = (id) => {
  return API.delete(`/customers/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
};

// Get all customers (with optional filters)
export const getAllCustomers = (params = {}) => {
  return API.get(`/customers`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    params: params
  });
};