import axios from "axios";
import API from "./axios";



API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

// ✅ Create Order
export const createOrder = async (orderData) => {
  try {
    const response = await API.post("/orders", orderData);
    return response;
  } catch (error) {
    console.error("API Error - createOrder:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get All Orders
export const getAllOrders = async () => {
  try {
    const response = await API.get("/orders");
    return response;
  } catch (error) {
    console.error("API Error - getAllOrders:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get Order By ID
export const getOrderById = async (id) => {
  try {
    const response = await API.get(`/orders/${id}`);
    return response;
  } catch (error) {
    console.error("API Error - getOrderById:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Get Orders By Customer
export const getOrdersByCustomer = async (customerId) => {
  try {
    const response = await API.get(`/orders/customer/${customerId}`);
    return response;
  } catch (error) {
    console.error("API Error - getOrdersByCustomer:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Update Order
export const updateOrder = async (id, updatedData) => {
  try {
    const response = await API.put(`/orders/${id}`, updatedData);
    return response;
  } catch (error) {
    console.error("API Error - updateOrder:", error.response?.data || error.message);
    throw error;
  }
};

// ✅ Delete Order
export const deleteOrder = async (id) => {
  try {
    const response = await API.delete(`/orders/${id}`);
    return response;
  } catch (error) {
    console.error("API Error - deleteOrder:", error.response?.data || error.message);
    throw error;
  }
};