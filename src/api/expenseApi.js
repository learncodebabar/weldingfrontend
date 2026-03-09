// src/api/expenseApi.js
import axios from "axios";
import API from "./axios";

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Create new expense
export const createExpense = async (expenseData) => {
  try {
    const response = await API.post("/expenses", expenseData);
    return response;
  } catch (error) {
    console.error("API Error - createExpense:", error.response?.data || error.message);
    throw error;
  }
};

// Get expenses by order
export const getExpensesByOrder = async (orderId) => {
  try {
    const response = await API.get(`/expenses/order/${orderId}`);
    return response;
  } catch (error) {
    console.error("API Error - getExpensesByOrder:", error.response?.data || error.message);
    throw error;
  }
};

// Update expense
export const updateExpense = async (expenseId, expenseData) => {
  try {
    const response = await API.put(`/expenses/${expenseId}`, expenseData);
    return response;
  } catch (error) {
    console.error("API Error - updateExpense:", error.response?.data || error.message);
    throw error;
  }
};
export const getAllExpenses = async () => {
  try {
    const response = await API.get("/expenses");
    return response;
  } catch (error) {
    console.error("API Error - getAllExpenses:", error.response?.data || error.message);
    throw error;
  }
};

// Delete expense
export const deleteExpense = async (expenseId) => {
  try {
    const response = await API.delete(`/expenses/${expenseId}`);
    return response;
  } catch (error) {
    console.error("API Error - deleteExpense:", error.response?.data || error.message);
    throw error;
  }
};