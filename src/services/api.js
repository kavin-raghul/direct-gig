import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Ensure token is properly formatted
      const cleanToken = token.trim();
      if (cleanToken && !cleanToken.includes(' ')) {
        config.headers.Authorization = `Bearer ${cleanToken}`;
        console.log('Token attached to request:', cleanToken.substring(0, 20) + '...');
      } else {
        console.error('Invalid token format detected:', token);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else {
      console.log('No token found for request');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    
    // Only redirect on 401 if it's not a login attempt
    if (error.response?.status === 401) {
      const isLoginAttempt = error.config?.url?.includes('/auth/login');
      
      if (!isLoginAttempt) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    
    if (error.response?.status === 403 && error.response?.data?.message === 'Invalid token format') {
      console.error('Token format issue detected. Clearing stored data.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default api;