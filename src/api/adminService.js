import API from './axios';

const adminService = {
  // ==================== Authentication ====================

  /**
   * Login admin
   * @param {Object} credentials - { email, password }
   * @returns {Promise} - Response with token and user data
   */
  login: async (credentials) => {
    try {
      const response = await API.post('/admin/login', credentials);
      
      // Store token and user data in localStorage
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Register admin (only once)
   * @param {Object} userData - { name, email, password }
   * @returns {Promise} - Response with success message
   */
  register: async (userData) => {
    try {
      const response = await API.post('/admin/signup', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get admin profile
   * @returns {Promise} - Response with user data
   */
  getProfile: async () => {
    try {
      const response = await API.get('/admin/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Update admin profile
   * @param {Object} data - { name, email }
   * @returns {Promise} - Response with updated user data
   */
  updateProfile: async (data) => {
    try {
      const response = await API.put('/admin/update-profile', data);
      
      // Update localStorage if user data changed
      if (response.data.user) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          ...response.data.user
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Change password
   * @param {Object} data - { currentPassword, newPassword }
   * @returns {Promise} - Response with success message
   */
  changePassword: async (data) => {
    try {
      const response = await API.put('/admin/change-password', data);
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // ==================== OTP Management ====================

  /**
   * Get OTP status
   * @returns {Promise} - Response with OTP enabled status
   */
  getOtpStatus: async () => {
    try {
      const response = await API.get('/admin/otp-status');
      return response.data;
    } catch (error) {
      console.error('Get OTP status error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Toggle OTP enable/disable
   * @param {boolean} enabled - OTP enabled status
   * @returns {Promise} - Response with updated status
   */
  toggleOtp: async (enabled) => {
    try {
      const response = await API.post('/admin/toggle-otp', { enabled });
      return response.data;
    } catch (error) {
      console.error('Toggle OTP error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Verify OTP code
   * @param {Object} data - { email, otp }
   * @returns {Promise} - Response with token and user data
   */
  verifyOtp: async (data) => {
    try {
      const response = await API.post('/admin/verify-otp', data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Resend OTP code
   * @param {string} email - User email
   * @returns {Promise} - Response with success message
   */
  resendOtp: async (email) => {
    try {
      const response = await API.post('/admin/resend-otp', { email });
      return response.data;
    } catch (error) {
      console.error('Resend OTP error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // ==================== Session Management ====================

  /**
   * Logout admin
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Verify token
   * @returns {Promise} - Response with user data if token is valid
   */
  verifyToken: async () => {
    try {
      const response = await API.get('/admin/verify');
      return response.data;
    } catch (error) {
      console.error('Verify token error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null} - User object or null
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} - True if token exists
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default adminService;