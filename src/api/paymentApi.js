// src/api/paymentApi.js
import axios from "axios";
import API from "./axios";

// 🔐 Token Interceptor
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// 🔴 Common Error Handler
const handleError = (error, functionName) => {
  console.error(`API Error - ${functionName}:`, 
    error.response?.data?.message || error.message
  );
  throw error.response?.data || error;
};

// ✅ Create Payment
export const createPayment = async (paymentData) => {
  try {
    const { data } = await API.post("/payments", paymentData);
    return data;
  } catch (error) {
    handleError(error, "createPayment");
  }
};

// ✅ Get Payments By Order
export const getPaymentsByOrder = async (orderId) => {
  try {
    const { data } = await API.get(`/payments/order/${orderId}`);
    return data;
  } catch (error) {
    handleError(error, "getPaymentsByOrder");
  }
};

// ✅ Get Single Payment
export const getPaymentById = async (paymentId) => {
  try {
    const { data } = await API.get(`/payments/${paymentId}`);
    return data;
  } catch (error) {
    handleError(error, "getPaymentById");
  }
};
// ✅ Get All Payments
export const getAllPayments = async () => {
  try {
    const { data } = await API.get("/payments");
    return data;
  } catch (error) {
    handleError(error, "getAllPayments");
  }
};
// ✅ Update Payment
export const updatePayment = async (paymentId, paymentData) => {
  try {
    const { data } = await API.put(`/payments/${paymentId}`, paymentData);
    return data;
  } catch (error) {
    handleError(error, "updatePayment");
  }
};

// ✅ Delete Payment
export const deletePayment = async (paymentId) => {
  try {
    const { data } = await API.delete(`/payments/${paymentId}`);
    return data;
  } catch (error) {
    handleError(error, "deletePayment");
  }
};