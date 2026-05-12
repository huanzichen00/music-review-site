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

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      // 让浏览器自动补上 multipart 边界
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，统一处理错误
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const requestConfig = error.config || {};
    const method = String(requestConfig.method || '').toLowerCase();
    const isMutating = ['post', 'put', 'patch', 'delete'].includes(method);
    const requestUrl = requestConfig.url || '';

    // CSRF 令牌可能过期或失效；刷新一次后重试写操作请求。
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
        // 刷新失败时继续走常规的 403 处理逻辑
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
