import api from './axios';

export const artistsApi = {
  getAll: () => api.get('/artists'),
  getByInitial: (letter) => api.get(`/artists/initial/${letter}`),
  getById: (id) => api.get(`/artists/${id}`),
  search: (query) => api.get(`/artists/search?q=${query}`),
  create: (data) => api.post('/artists', data),
  update: (id, data) => api.put(`/artists/${id}`, data),
  delete: (id) => api.delete(`/artists/${id}`),
};
