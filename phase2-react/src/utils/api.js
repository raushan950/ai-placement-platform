export const API_URL = 'https://ai-placement-platform-sskk.onrender.com/api';

export const fetchAPI = async (endpoint, payload, method = "POST", isFormData = false) => {
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
