import API from "./axios";

const getToken = () => localStorage.getItem("adminToken");

export const createJob = (data) => {
  const token = getToken();
  return API.post("/jobs", data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getCustomerJobs = (customerId) => {
  const token = getToken();
  return API.get(`/jobs/customer/${customerId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getJobById = (jobId) => {
  const token = getToken();
  return API.get(`/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const updateJob = (jobId, data) => {
  const token = getToken();
  return API.put(`/jobs/${jobId}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const deleteJob = (jobId) => {
  const token = getToken();
  return API.delete(`/jobs/${jobId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
};

export const getAllJobs = (params = {}) => {
  const token = getToken();
  return API.get("/jobs", {
    headers: { Authorization: `Bearer ${token}` },
    params: params
  });
};

// ✅ نیا Constant - انہی APIs کو استعمال کرتا ہے لیکن نام الگ ہے
export const fetchJobsByCustomer = async (customerId) => {
  try {
    const response = await getCustomerJobs(customerId);
    return response;
  } catch (error) {
    console.error("Error in fetchJobsByCustomer:", error);
    throw error;
  }
};

export const fetchJobDetails = async (jobId) => {
  try {
    const response = await getJobById(jobId);
    return response;
  } catch (error) {
    console.error("Error in fetchJobDetails:", error);
    throw error;
  }
};