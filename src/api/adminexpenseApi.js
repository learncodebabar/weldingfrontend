import API from './axios';

// ========== ADMIN EXPENSE API FUNCTIONS ==========

/**
 * Get all expenses with filters
 */
export const getAllExpenses = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await API.get(`/admin/expenses${queryParams ? `?${queryParams}` : ''}`);
    return response.data; // Yeh abhi { success, data, pagination, summary } return karega
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

/**
 * Create a new expense
 */
export const createExpense = async (expenseData) => {
  try {
    const response = await API.post('/admin/expenses', expenseData);
    return response.data; // { success, data, message }
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

/**
 * Get single expense by ID
 */
export const getExpenseById = async (id) => {
  try {
    const response = await API.get(`/admin/expenses/${id}`);
    return response.data; // { success, data }
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

/**
 * Update expense
 */
export const updateExpense = async (id, expenseData) => {
  try {
    const response = await API.put(`/admin/expenses/${id}`, expenseData);
    return response.data; // { success, data, message }
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

/**
 * Delete expense
 */
export const deleteExpense = async (id) => {
  try {
    const response = await API.delete(`/admin/expenses/${id}`);
    return response.data; // { success, message }
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

/**
 * Get expense statistics for dashboard
 */
export const getExpenseStats = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await API.get(`/admin/expenses/stats/dashboard${queryParams ? `?${queryParams}` : ''}`);
    return response.data; // { success, data }
  } catch (error) {
    console.error('Error fetching expense stats:', error);
    throw error;
  }
};

/**
 * Get expenses by category
 */
export const getExpensesByCategory = async (category, filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await API.get(`/admin/expenses/categories/${category}${queryParams ? `?${queryParams}` : ''}`);
    return response.data; // { success, data, pagination, categoryTotal }
  } catch (error) {
    console.error('Error fetching expenses by category:', error);
    throw error;
  }
};

/**
 * Bulk delete expenses
 */
export const bulkDeleteExpenses = async (expenseIds) => {
  try {
    const response = await API.delete('/admin/expenses/bulk', { data: { expenseIds } });
    return response.data; // { success, message, deletedCount }
  } catch (error) {
    console.error('Error bulk deleting expenses:', error);
    throw error;
  }
};

/**
 * Export expenses to CSV
 */
export const exportExpensesToCSV = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const response = await API.get(`/admin/expenses/export/csv${queryParams ? `?${queryParams}` : ''}`, {
      responseType: 'blob' // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true, message: 'File downloaded successfully' };
  } catch (error) {
    console.error('Error exporting expenses:', error);
    throw error;
  }
};