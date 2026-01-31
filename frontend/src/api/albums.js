import api from './axios';

export const albumsApi = {
  getAll: () => api.get('/albums'),
  getByInitial: (letter) => api.get(`/albums/initial/${letter}`),
  getById: (id) => api.get(`/albums/${id}`),
  getByArtist: (artistId) => api.get(`/albums/artist/${artistId}`),
  getByGenre: (genreId) => api.get(`/albums/genre/${genreId}`),
  getByYear: (year) => api.get(`/albums/year/${year}`),
  getYears: () => api.get('/albums/years'),
  search: (query) => api.get(`/albums/search?q=${query}`),
  create: (data) => api.post('/albums', data),
  update: (id, data) => api.put(`/albums/${id}`, data),
  delete: (id) => api.delete(`/albums/${id}`),
};
