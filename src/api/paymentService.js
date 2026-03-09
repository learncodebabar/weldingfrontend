import API from './axios';

const paymentService = {
  // ==================== Payment CRUD Operations ====================

  /**
   * Add new payment for a worker
   * @param {Object} paymentData - Payment data
   * @returns {Promise} - Response with payment details and balance
   */
  addPayment: async (paymentData) => {
    try {
      const response = await API.post('/worker-payment/add', paymentData);
      return response.data;
    } catch (error) {
      console.error('Add payment error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get all payments for a specific worker
   * @param {string} laborId - Worker ID
   * @param {Object} params - Query params (month, year)
   * @returns {Promise} - Response with payments list and summary
   */
  getPaymentsByLabor: async (laborId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.month) queryParams.append('month', params.month);
      if (params.year) queryParams.append('year', params.year);
      
      const url = `/worker-payment/labor/${laborId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error('Get payments error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get complete payment summary for a worker (all months)
   * @param {string} laborId - Worker ID
   * @returns {Promise} - Response with complete summary
   */
  getPaymentSummary: async (laborId) => {
    try {
      const response = await API.get(`/worker-payment/summary/${laborId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment summary error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get monthly payment details for a worker
   * @param {string} laborId - Worker ID
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Promise} - Response with monthly details
   */
  getMonthlyPaymentDetails: async (laborId, month, year) => {
    try {
      const response = await API.get(
        `/worker-payment/monthly/${laborId}?month=${month}&year=${year}`
      );
      return response.data;
    } catch (error) {
      console.error('Get monthly details error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get single payment by ID
   * @param {string} paymentId - Payment ID
   * @returns {Promise} - Response with payment details
   */
  getPaymentById: async (paymentId) => {
    try {
      const response = await API.get(`/worker-payment/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Get payment by ID error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Delete a payment
   * @param {string} paymentId - Payment ID
   * @returns {Promise} - Response with success message
   */
  deletePayment: async (paymentId) => {
    try {
      const response = await API.delete(`/worker-payment/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete payment error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // ==================== Helper Functions ====================

  /**
   * Format payment amount
   * @param {number} amount - Amount to format
   * @returns {string} - Formatted amount
   */
  formatAmount: (amount) => {
    return `Rs. ${amount?.toLocaleString() || 0}`;
  },

  /**
   * Format date
   * @param {string} date - Date string
   * @returns {string} - Formatted date
   */
  formatDate: (date) => {
    return new Date(date).toLocaleDateString('en-PK', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  },

  /**
   * Calculate payment percentage
   * @param {number} totalEarnings - Total earnings
   * @param {number} totalPaid - Total paid
   * @returns {number} - Payment percentage
   */
  calculatePercentage: (totalEarnings, totalPaid) => {
    if (!totalEarnings || totalEarnings <= 0) return 0;
    return ((totalPaid / totalEarnings) * 100).toFixed(1);
  }
};

export default paymentService;