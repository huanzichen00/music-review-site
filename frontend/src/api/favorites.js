import api from './axios';

export const favoritesApi = {
  getMyFavorites: (config = {}) => api.get('/favorites', config),
  checkFavorite: (albumId, config = {}) => api.get(`/favorites/check/${albumId}`, config),
  addFavorite: (albumId) => api.post(`/favorites/${albumId}`),
  removeFavorite: (albumId) => api.delete(`/favorites/${albumId}`),
};
