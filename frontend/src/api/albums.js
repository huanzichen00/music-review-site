import api from './axios';
import { cachedApiGet, invalidateApiCache } from './cache';

const ALBUMS_ALL_CACHE_KEY = 'albums:getAll';
const ALBUMS_ALL_TTL_MS = 45 * 1000;

export const albumsApi = {
  getAll: (options = {}) => {
    const page = Number.isInteger(options.page) ? options.page : 0;
    const size = Number.isInteger(options.size) ? options.size : 20;
    return cachedApiGet({
      key: `${ALBUMS_ALL_CACHE_KEY}:${page}:${size}`,
      request: () =>
        api.get('/albums', {
          signal: options.signal,
          params: { page, size },
        }),
      ttlMs: ALBUMS_ALL_TTL_MS,
      force: Boolean(options.force),
    });
  },
  getByInitial: (letter, config = {}) => api.get(`/albums/initial/${letter}`, config),
  getById: (id, config = {}) => api.get(`/albums/${id}`, config),
  getByArtist: (artistId, config = {}) => api.get(`/albums/artist/${artistId}`, config),
  getByGenre: (genreId, config = {}) => api.get(`/albums/genre/${genreId}`, config),
  getByYear: (year, config = {}) => api.get(`/albums/year/${year}`, config),
  getYears: (config = {}) => api.get('/albums/years', config),
  search: (query, config = {}) => api.get(`/albums/search?q=${query}`, config),
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
