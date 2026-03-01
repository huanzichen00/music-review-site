import api from './axios';

export const questionBanksApi = {
  getPublic: (config = {}) => api.get('/question-banks/public', config),
  getPublicById: (id, config = {}) => api.get(`/question-banks/public/${id}`, config),
  getByShareToken: (shareToken, config = {}) => api.get(`/question-banks/share/${shareToken}`, config),
  getMine: (config = {}) => api.get('/question-banks/mine', config),
  getMineById: (id, config = {}) => api.get(`/question-banks/${id}`, config),
  create: (data) => api.post('/question-banks', data),
  update: (id, data) => api.put(`/question-banks/${id}`, data),
  updateItems: (id, data) => api.put(`/question-banks/${id}/items`, data),
  remove: (id) => api.delete(`/question-banks/${id}`),
};
