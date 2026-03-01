import api from './axios';
import { cachedApiGet, invalidateApiCache } from './cache';

const ARTISTS_ALL_CACHE_KEY = 'artists:getAll';
const ARTISTS_ALL_TTL_MS = 45 * 1000;

export const artistsApi = {
  getAll: (options = {}) =>
    cachedApiGet({
      key: ARTISTS_ALL_CACHE_KEY,
      request: () => api.get('/artists', { signal: options.signal }),
      ttlMs: ARTISTS_ALL_TTL_MS,
      force: Boolean(options.force),
    }),
  getByInitial: (letter, config = {}) => api.get(`/artists/initial/${letter}`, config),
  getById: (id, config = {}) => api.get(`/artists/${id}`, config),
  search: (query, config = {}) => api.get(`/artists/search?q=${query}`, config),
  create: async (data) => {
    const res = await api.post('/artists', data);
    invalidateApiCache(ARTISTS_ALL_CACHE_KEY);
    return res;
  },
  update: async (id, data) => {
    const res = await api.put(`/artists/${id}`, data);
    invalidateApiCache(ARTISTS_ALL_CACHE_KEY);
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/artists/${id}`);
    invalidateApiCache(ARTISTS_ALL_CACHE_KEY);
    return res;
  },
};
