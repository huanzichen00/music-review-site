import api from './axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCsrf: () => api.get('/auth/csrf'),
  getMe: () => api.get('/auth/me'),
};
