import API from "./axios";

const attendanceService = {
  // Mark attendance
  markAttendance: async (attendanceData) => {
    try {
      console.log('📤 Marking attendance with data:', attendanceData);
      const response = await API.post('/attendance', attendanceData);
      console.log('📥 Mark attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Mark attendance error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error.response?.data || { message: error.message };
    }
  },

  // Get today's attendance
  getTodayAttendance: async () => {
    try {
      console.log('📤 Fetching today\'s attendance...');
      const response = await API.get('/attendance/today');
      console.log('📥 Today\'s attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get today attendance error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error.response?.data || { message: error.message };
    }
  },

  // Get attendance by date
  getAttendanceByDate: async (date) => {
    try {
      console.log(`📤 Fetching attendance for date: ${date}`);
      const response = await API.get(`/attendance/date/${date}`);
      console.log('📥 Date attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get date attendance error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Get monthly attendance
  getMonthlyAttendance: async (month, year) => {
    try {
      console.log(`📤 Fetching attendance for ${month}/${year}...`);
      const response = await API.get(`/attendance/month/${month}/${year}`);
      console.log('📥 Monthly attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Get monthly attendance error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error.response?.data || { message: error.message };
    }
  },

  // Get attendance by labor ID
  getAttendanceByLabor: async (laborId, month, year) => {
    try {
      let url = `/attendance/labor/${laborId}`;
      if (month && year) {
        url += `?month=${month}&year=${year}`;
      }
      console.log(`📤 Fetching attendance for labor: ${laborId}`);
      const response = await API.get(url);
      return response.data;
    } catch (error) {
      console.error('❌ Get labor attendance error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Update attendance
  updateAttendance: async (id, attendanceData) => {
    try {
      console.log(`📤 Updating attendance: ${id}`, attendanceData);
      const response = await API.put(`/attendance/${id}`, attendanceData);
      console.log('📥 Update response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Update attendance error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Delete attendance
  deleteAttendance: async (id) => {
    try {
      console.log(`📤 Deleting attendance: ${id}`);
      const response = await API.delete(`/attendance/${id}`);
      console.log('📥 Delete response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Delete attendance error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Get attendance summary
  getAttendanceSummary: async (month, year) => {
    try {
      console.log(`📤 Fetching attendance summary for ${month}/${year}`);
      const response = await API.get(`/attendance/summary/${month}/${year}`);
      return response.data;
    } catch (error) {
      console.error('❌ Get summary error:', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  },

  // Mark bulk attendance - FIXED VERSION
  markBulkAttendance: async (attendanceList) => {
    try {
      console.log(`📤 Marking bulk attendance for ${attendanceList.length} workers`);
      console.log('📤 Attendance list:', attendanceList);
      
      // IMPORTANT: Send as { attendance: attendanceList } not { attendanceList }
      const response = await API.post('/attendance/bulk', { 
        attendance: attendanceList 
      });
      
      console.log('📥 Bulk attendance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Bulk attendance error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        data: error.config?.data
      });
      throw error.response?.data || { message: error.message };
    }
  },

  // Alternative method if backend expects different format
  markBulkAttendanceAlt: async (attendanceList) => {
    try {
      console.log(`📤 Marking bulk attendance (alt) for ${attendanceList.length} workers`);
      
      // If backend expects direct array
      const response = await API.post('/attendance/bulk', attendanceList);
      
      console.log('📥 Bulk attendance response (alt):', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Bulk attendance error (alt):', error.response?.data || error.message);
      throw error.response?.data || error.message;
    }
  }
};

export default attendanceService;