import api from './axios';

export const questionBanksApi = {
  getPublic: () => api.get('/question-banks/public'),
  getPublicById: (id) => api.get(`/question-banks/public/${id}`),
  getByShareToken: (shareToken) => api.get(`/question-banks/share/${shareToken}`),
  getMine: () => api.get('/question-banks/mine'),
  getMineById: (id) => api.get(`/question-banks/${id}`),
  create: (data) => api.post('/question-banks', data),
  update: (id, data) => api.put(`/question-banks/${id}`, data),
  updateItems: (id, data) => api.put(`/question-banks/${id}/items`, data),
  remove: (id) => api.delete(`/question-banks/${id}`),
};
