import api from './axios';

export const favoritesApi = {
  getMyFavorites: () => api.get('/favorites'),
  checkFavorite: (albumId) => api.get(`/favorites/check/${albumId}`),
  addFavorite: (albumId) => api.post(`/favorites/${albumId}`),
  removeFavorite: (albumId) => api.delete(`/favorites/${albumId}`),
};
