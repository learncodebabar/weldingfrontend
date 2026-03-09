import API from "./axios";

const PROFILE_URL = "/profile";

// Helper to get token
const getToken = () => localStorage.getItem("adminToken");

// Helper to get full logo URL
const getFullLogoUrl = (logoPath) => {
  if (!logoPath) return null;
  
  // If it's already a full URL, return as is
  if (logoPath.startsWith('http')) {
    return logoPath;
  }
  
  // Get baseURL from API instance's default baseURL
  const baseURL = API.defaults.baseURL ;
  // Remove /api from baseURL for static files
  const staticBaseURL = baseURL.replace('/api', '');
  return `${staticBaseURL}/${logoPath}`;
};

// GET Profile
export const getProfile = async () => {
  try {
    const response = await API.get(PROFILE_URL, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    // Process the response to add full logo URL
    const data = response.data;
    
    if (data && data.logo) {
      data.logoUrl = getFullLogoUrl(data.logo);
    } else if (data.data && data.data.logo) {
      data.data.logoUrl = getFullLogoUrl(data.data.logo);
    }
    
    return data;
  } catch (error) {
    console.error("Error fetching profile:", error);
    throw error;
  }
};

// CREATE Profile (Only Once)
export const createProfile = async (formData) => {
  try {
    const response = await API.post(PROFILE_URL, formData, {
      headers: { 
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data" 
      }
    });
    
    // Process the response
    const data = response.data;
    if (data && data.logo) {
      data.logoUrl = getFullLogoUrl(data.logo);
    } else if (data.data && data.data.logo) {
      data.data.logoUrl = getFullLogoUrl(data.data.logo);
    }
    
    return data;
  } catch (error) {
    console.error("Error creating profile:", error);
    throw error;
  }
};

// UPDATE Profile
export const updateProfile = async (formData) => {
  try {
    const response = await API.put(PROFILE_URL, formData, {
      headers: { 
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "multipart/form-data" 
      }
    });
    
    // Process the response
    const data = response.data;
    if (data && data.logo) {
      data.logoUrl = getFullLogoUrl(data.logo);
    } else if (data.data && data.data.logo) {
      data.data.logoUrl = getFullLogoUrl(data.data.logo);
    }
    
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// DELETE Profile
export const deleteProfile = async () => {
  try {
    const response = await API.delete(PROFILE_URL, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting profile:", error);
    throw error;
  }
};