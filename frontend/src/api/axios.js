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
      // Forbidden - token expired or invalid, need to re-login
      console.error('403 Forbidden - Token expired or invalid');
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found in localStorage');
        window.location.href = '/login';
      } else {
        console.error('Token exists but was rejected. This usually means the token was signed with an old secret. Please re-login.');
        // Auto redirect to login after a short delay
        setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }, 1000);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
