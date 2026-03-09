// src/config/config.js
// Check if we're in Electron
const isElectron = () => {
  return window && window.process && window.process.type === 'renderer';
};

// Get base URL - try multiple sources
const getBaseUrl = () => {
  // Try import.meta.env first (for Vite dev)
  if (import.meta && import.meta.env && import.meta.env.VITE_REACT_BACKEND_BASE) {
    console.log('✅ Using VITE_REACT_BACKEND_BASE from env:', import.meta.env.VITE_REACT_BACKEND_BASE);
    return import.meta.env.VITE_REACT_BACKEND_BASE;
  }
  
  // Try process.env (for Electron)
  if (process && process.env && process.env.VITE_REACT_BACKEND_BASE) {
    console.log('✅ Using VITE_REACT_BACKEND_BASE from process.env:', process.env.VITE_REACT_BACKEND_BASE);
    return process.env.VITE_REACT_BACKEND_BASE;
  }
  
  // Fallback - use current hostname in production
  if (!import.meta.env.DEV) {
    const hostname = window.location.hostname;
    console.log('🌐 Using hostname:', hostname);
    return `http://${hostname}:3000/api`;
  }
  
  // Final fallback for development
  console.log('⚠️ Using fallback URL');
  return 'http://localhost:3000/api';
};

export const VITE_REACT_BACKEND_BASE = getBaseUrl();
export const VITE_BACKEND_URL = VITE_REACT_BACKEND_BASE.replace('/api', '');
export const VITE_LOCAL_IP = '10.12.19.20'; // Update this to match your current IP
export const VITE_BACKEND_PORT = 3000;

console.log('🔧 Config loaded:', {
  VITE_REACT_BACKEND_BASE,
  VITE_BACKEND_URL,
  VITE_LOCAL_IP,
  VITE_BACKEND_PORT
});