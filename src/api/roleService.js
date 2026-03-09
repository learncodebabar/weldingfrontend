import API from './axios';

const roleService = {
  // Get all roles
  getAllRoles: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await API.get('/roles', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get roles error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // Create new role
  createRole: async (roleData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await API.post('/roles', roleData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Create role error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // Get role by ID
  getRoleById: async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await API.get(`/roles/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Get role error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // Update role
  updateRole: async (id, roleData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await API.put(`/roles/${id}`, roleData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Update role error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // Delete role
  deleteRole: async (id) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await API.delete(`/roles/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Delete role error:', error);
      throw error.response?.data || { message: error.message };
    }
  },

  // Role login
  roleLogin: async (credentials) => {
    try {
      const response = await API.post('/roles/login', credentials);
      
      if (response.data.token) {
        localStorage.setItem('roleToken', response.data.token);
        localStorage.setItem('roleUser', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('Role login error:', error);
      throw error.response?.data || { message: error.message };
    }
  }
};

export default roleService;