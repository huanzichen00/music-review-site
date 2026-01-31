import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      // Forbidden - might be token issue
      console.error('403 Forbidden - Token might be expired or invalid');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        window.location.href = '/login';
      } else {
        console.error('Token exists but request was forbidden. Token:', token.substring(0, 20) + '...');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
