import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      // Let the browser set multipart boundary
      delete config.headers['Content-Type'];
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
  async (error) => {
    const status = error.response?.status;
    const requestConfig = error.config || {};
    const method = String(requestConfig.method || '').toLowerCase();
    const isMutating = ['post', 'put', 'patch', 'delete'].includes(method);
    const requestUrl = requestConfig.url || '';

    // CSRF token may expire or become stale; refresh once and retry mutating request.
    if (
      status === 403 &&
      isMutating &&
      !requestConfig._csrfRetried &&
      !requestUrl.includes('/auth/csrf')
    ) {
      try {
        await api.get('/auth/csrf');
        return api({
          ...requestConfig,
          _csrfRetried: true,
        });
      } catch {
        // fall through to normal 403 handling
      }
    }

    if (error.response?.status === 401) {
      const isUploadEndpoint = requestUrl.includes('/files/album-cover');
      const isMeEndpoint = requestUrl.includes('/auth/me');
      if (isMeEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (!isUploadEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
