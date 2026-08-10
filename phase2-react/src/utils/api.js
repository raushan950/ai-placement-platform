export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Detect if we are in production but calling localhost
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const isCallingLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

export const fetchAPI = async (endpoint, payload, method = "POST", isFormData = false) => {
  if (isProduction && isCallingLocalhost) {
    console.error("❌ Production misconfiguration: VITE_API_URL is missing or set to localhost.");
    return { error: 'Application configuration error: Production frontend cannot connect to a local API server. Please configure VITE_API_URL in Vercel.' };
  }

  try {
    const headers = {};
    if (!isFormData) {
       headers['Content-Type'] = 'application/json';
    }
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = {
      method,
      headers
    };
    
    if (payload) {
       config.body = isFormData ? payload : JSON.stringify(payload);
    }

    const res = await fetch(`${API_URL}${endpoint}`, config);
    return await res.json();
  } catch(err) { 
    return { error: 'Failed to connect to server' };
  }
};
