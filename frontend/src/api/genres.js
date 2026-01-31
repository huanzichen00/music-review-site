import api from './axios';

export const genresApi = {
  getAll: () => api.get('/genres'),
  getById: (id) => api.get(`/genres/${id}`),
  create: (data) => api.post('/genres', data),
};
