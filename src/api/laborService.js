import API from "./axios";

 


const laborService = {
  // Add new labor
  addLabor: async (laborData) => {
    try {
      const response = await API.post('/labor', laborData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all labor
  getAllLabor: async () => {
    try {
      const response = await API.get('/labor');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get labor by ID
  getLaborById: async (id) => {
    try {
      const response = await API.get(`/labor/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update labor
  updateLabor: async (id, laborData) => {
    try {
      const response = await API.put(`/labor/${id}`, laborData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete labor
  deleteLabor: async (id) => {
    try {
      const response = await API.delete(`/labor/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get labor by payment type
  getLaborByType: async (type) => {
    try {
      const response = await API.get(`/labor/type/${type}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get active labor count
  getActiveLabor: async () => {
    try {
      const response = await API.get('/labor/status/active');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get labor statistics
  getLaborStats: async () => {
    try {
      const response = await API.get('/labor/stats/summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default laborService;