import api from './axios';

export const favoritesApi = {
  getMyFavorites: (options = {}) =>
    api.get('/favorites', {
      signal: options.signal,
      params: {
        page: Number.isInteger(options.page) ? options.page : 0,
        size: Number.isInteger(options.size) ? options.size : 100,
      },
    }),
  checkFavorite: (albumId, config = {}) => api.get(`/favorites/check/${albumId}`, config),
  addFavorite: (albumId) => api.post(`/favorites/${albumId}`),
  removeFavorite: (albumId) => api.delete(`/favorites/${albumId}`),
};
