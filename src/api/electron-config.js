// src/api/electron-config.js

// Detect if running in Electron
export const isElectron = () => {
  // Check multiple ways to detect Electron
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    (window && window.electronAPI !== undefined) ||
    (window && window.process && window.process.type === 'renderer') ||
    (window && window.require) ||
    userAgent.indexOf(' electron/') > -1 ||
    import.meta.env.VITE_IS_ELECTRON === 'true' ||
    import.meta.env.VITE_IS_ELECTRON === true
  );
};

// Get API URL from Electron main process
export const getApiUrlFromElectron = async () => {
  try {
    // Check if electronAPI is available (from preload.js)
    if (window.electronAPI && window.electronAPI.getApiUrl) {
      console.log('📡 Getting API URL from electronAPI.getApiUrl()');
      return await window.electronAPI.getApiUrl();
    }
    
    // Fallback: try to get from IPC directly
    if (window.ipcRenderer) {
      console.log('📡 Getting API URL from ipcRenderer.invoke()');
      return await window.ipcRenderer.invoke('get-api-url');
    }
    
    throw new Error('No Electron API available');
  } catch (error) {
    console.warn('❌ Failed to get API URL from Electron:', error);
    return null;
  }
};

// Get Backend URL from Electron
export const getBackendUrlFromElectron = async () => {
  try {
    if (window.electronAPI && window.electronAPI.getBackendUrl) {
      return await window.electronAPI.getBackendUrl();
    }
    if (window.ipcRenderer) {
      return await window.ipcRenderer.invoke('get-backend-url');
    }
    return null;
  } catch (error) {
    console.warn('Failed to get Backend URL from Electron:', error);
    return null;
  }
};

// Get Local IP from Electron
export const getLocalIpFromElectron = async () => {
  try {
    if (window.electronAPI && window.electronAPI.getLocalIp) {
      return await window.electronAPI.getLocalIp();
    }
    if (window.ipcRenderer) {
      return await window.ipcRenderer.invoke('get-local-ip');
    }
    return null;
  } catch (error) {
    console.warn('Failed to get Local IP from Electron:', error);
    return null;
  }
};

// Get Environment from Electron
export const getEnvironmentFromElectron = async () => {
  try {
    if (window.electronAPI && window.electronAPI.getEnvironment) {
      return await window.electronAPI.getEnvironment();
    }
    if (window.ipcRenderer) {
      return await window.ipcRenderer.invoke('get-environment');
    }
    return null;
  } catch (error) {
    console.warn('Failed to get Environment from Electron:', error);
    return null;
  }
};

// Get API URL (works in both browser and Electron)
export const getApiUrl = async () => {
  console.log('🔍 Determining API URL...');
  console.log('   isElectron:', isElectron());
  console.log('   window.electronAPI:', window.electronAPI ? '✅ Available' : '❌ Not available');
  
  // If in Electron, try to get from Electron first
  if (isElectron()) {
    const electronUrl = await getApiUrlFromElectron();
    if (electronUrl) {
      console.log('✅ Using Electron API URL:', electronUrl);
      return electronUrl;
    }
  }
  
  // Fallback to environment variables or auto-detection
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Try Vite environment variables
  if (import.meta.env.VITE_REACT_BACKEND_BASE) {
    console.log('✅ Using VITE_REACT_BACKEND_BASE:', import.meta.env.VITE_REACT_BACKEND_BASE);
    return import.meta.env.VITE_REACT_BACKEND_BASE;
  }
  
  if (import.meta.env.VITE_LOCAL_API && isLocalhost) {
    console.log('✅ Using VITE_LOCAL_API:', import.meta.env.VITE_LOCAL_API);
    return import.meta.env.VITE_LOCAL_API;
  }
  
  if (import.meta.env.VITE_NETWORK_API && !isLocalhost) {
    console.log('✅ Using VITE_NETWORK_API:', import.meta.env.VITE_NETWORK_API);
    return import.meta.env.VITE_NETWORK_API;
  }
  
  // Auto-detect based on hostname
  const port = import.meta.env.VITE_BACKEND_PORT || 3000;
  const apiUrl = isLocalhost 
    ? `http://localhost:${port}/api`
    : `http://${hostname}:${port}/api`;
  
  console.log('✅ Auto-detected API URL:', apiUrl);
  return apiUrl;
};

// Get Backend URL (base URL without /api)
export const getBackendUrl = async () => {
  if (isElectron()) {
    const electronUrl = await getBackendUrlFromElectron();
    if (electronUrl) return electronUrl;
  }
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const port = import.meta.env.VITE_BACKEND_PORT || 3000;
  
  if (import.meta.env.VITE_LOCAL_BACKEND && isLocalhost) {
    return import.meta.env.VITE_LOCAL_BACKEND;
  }
  
  if (import.meta.env.VITE_NETWORK_BACKEND && !isLocalhost) {
    return import.meta.env.VITE_NETWORK_BACKEND;
  }
  
  return isLocalhost 
    ? `http://localhost:${port}`
    : `http://${hostname}:${port}`;
};

// Get Local IP
export const getLocalIp = async () => {
  if (isElectron()) {
    const electronIp = await getLocalIpFromElectron();
    if (electronIp) return electronIp;
  }
  
  return import.meta.env.VITE_LOCAL_IP || window.location.hostname || 'localhost';
};

// Get Environment
export const getEnvironment = async () => {
  if (isElectron()) {
    const electronEnv = await getEnvironmentFromElectron();
    if (electronEnv) return electronEnv;
  }
  
  return import.meta.env.MODE || 'development';
};

// Export all functions
export default {
  isElectron,
  getApiUrl,
  getBackendUrl,
  getLocalIp,
  getEnvironment,
  getApiUrlFromElectron,
  getBackendUrlFromElectron,
  getLocalIpFromElectron,
  getEnvironmentFromElectron
};