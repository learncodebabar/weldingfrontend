// src/api/Vite_React_Backend_Base.js

// Get all possible URLs from Vite
const hostname = window.location.hostname;
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

// Get the configured URLs
const localApi = import.meta.env.VITE_LOCAL_API;
const networkApi = import.meta.env.VITE_NETWORK_API;
const networkIP = import.meta.env.VITE_LOCAL_IP;

// SMART SELECTION: Choose the right URL based on how the app was loaded
export const ViteBackendIP = isLocalhost ? localApi : networkApi;

// Also export individual components if needed
export const VITE_LOCAL_IP = networkIP;
export const VITE_BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT;
export const VITE_LOCAL_BACKEND = import.meta.env.VITE_LOCAL_BACKEND;
export const VITE_NETWORK_BACKEND = import.meta.env.VITE_NETWORK_BACKEND;
export const VITE_LOCAL_API = localApi;
export const VITE_NETWORK_API = networkApi;

// Log what's happening (super helpful for debugging)
console.log('=================================')
console.log('📍 Window Location:', window.location.href)
console.log('🏠 Hostname:', hostname)
console.log('🔍 Is Localhost?', isLocalhost ? 'YES' : 'NO')
console.log('---------------------------------')
console.log('📡 Selected Backend URL:', ViteBackendIP)
console.log('   ↳ Using:', isLocalhost ? 'LOCALHOST mode' : 'NETWORK mode')
console.log('---------------------------------')
console.log('🏠 Local API (for localhost):', localApi)
console.log('🌍 Network API (for network):', networkApi)
console.log('📱 Access from mobile: http://' + networkIP + ':5173')
console.log('=================================')

// Export the selected URL as default
export default ViteBackendIP;