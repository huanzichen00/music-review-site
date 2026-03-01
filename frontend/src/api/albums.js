import api from './axios';
import { cachedApiGet, invalidateApiCache } from './cache';

const ALBUMS_ALL_CACHE_KEY = 'albums:getAll';
const ALBUMS_ALL_TTL_MS = 45 * 1000;

export const albumsApi = {
  getAll: (options = {}) =>
    cachedApiGet({
      key: ALBUMS_ALL_CACHE_KEY,
      request: () => api.get('/albums'),
      ttlMs: ALBUMS_ALL_TTL_MS,
      force: Boolean(options.force),
    }),
  getByInitial: (letter) => api.get(`/albums/initial/${letter}`),
  getById: (id) => api.get(`/albums/${id}`),
  getByArtist: (artistId) => api.get(`/albums/artist/${artistId}`),
  getByGenre: (genreId) => api.get(`/albums/genre/${genreId}`),
  getByYear: (year) => api.get(`/albums/year/${year}`),
  getYears: () => api.get('/albums/years'),
  search: (query) => api.get(`/albums/search?q=${query}`),
  create: async (data) => {
    const res = await api.post('/albums', data);
    invalidateApiCache(ALBUMS_ALL_CACHE_KEY);
    return res;
  },
  update: async (id, data) => {
    const res = await api.put(`/albums/${id}`, data);
    invalidateApiCache(ALBUMS_ALL_CACHE_KEY);
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/albums/${id}`);
    invalidateApiCache(ALBUMS_ALL_CACHE_KEY);
    return res;
  },
};
