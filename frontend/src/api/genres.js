import api from './axios';
import { cachedApiGet, invalidateApiCache } from './cache';

const GENRES_ALL_CACHE_KEY = 'genres:getAll';
const GENRES_ALL_TTL_MS = 60 * 1000;

export const genresApi = {
  getAll: (options = {}) =>
    cachedApiGet({
      key: GENRES_ALL_CACHE_KEY,
      request: () => api.get('/genres'),
      ttlMs: GENRES_ALL_TTL_MS,
      force: Boolean(options.force),
    }),
  getById: (id) => api.get(`/genres/${id}`),
  create: async (data) => {
    const res = await api.post('/genres', data);
    invalidateApiCache(GENRES_ALL_CACHE_KEY);
    return res;
  },
};
