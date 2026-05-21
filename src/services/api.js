import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : 'https://direct-gig.onrender.com/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variables to handle multiple requests during a token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token.trim()}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent retry loops on auth routes
    if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors (Token is expired)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Must use standard axios to skip interceptors during refresh
        const refreshUrl = `${API_BASE_URL}/auth/refresh-token`;
        const response = await axios.post(refreshUrl, {}, { withCredentials: true });
        
        const newToken = response.data.token;
        localStorage.setItem('token', newToken);

        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        api.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
        originalRequest.headers['Authorization'] = 'Bearer ' + newToken;

        processQueue(null, newToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Critical clear out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Force redirect to login page gracefully
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;