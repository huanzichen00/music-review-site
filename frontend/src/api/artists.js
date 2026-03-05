import api from './axios';
import { cachedApiGet, invalidateApiCache } from './cache';
import { ttlCache } from '../utils/ttlCache';

const ARTISTS_ALL_CACHE_KEY = 'artists:getAll';
const ARTISTS_ALL_TTL_MS = 45 * 1000;
const ARTISTS_SESSION_CACHE_PREFIX = 'artists';
const artistsInflight = new Map();
const isDev = import.meta.env.DEV;

const unwrapListData = (data) => {
  if (Array.isArray(data?.content)) {
    return data.content;
  }
  return Array.isArray(data) ? data : [];
};

const makeArtistsCacheKey = (page, size) => `${ARTISTS_SESSION_CACHE_PREFIX}:p=${page}:s=${size}`;

export const artistsApi = {
  getAll: (options = {}) => {
    const page = Number.isInteger(options.page) ? options.page : 0;
    const size = Number.isInteger(options.size) ? options.size : 500;
    return cachedApiGet({
      key: `${ARTISTS_ALL_CACHE_KEY}:${page}:${size}`,
      request: () =>
        api.get('/artists', {
          signal: options.signal,
          params: { page, size },
        }),
      ttlMs: ARTISTS_ALL_TTL_MS,
      force: Boolean(options.force),
    });
  },
  getAllCached: async ({ page = 0, size = 200, ttlMs = 30_000, force = false, signal } = {}) => {
    const safePage = Number.isInteger(page) ? page : 0;
    const safeSize = Number.isInteger(size) ? size : 200;
    const cacheKey = makeArtistsCacheKey(safePage, safeSize);
    const inflightKey = `${cacheKey}:${force ? 'force' : 'normal'}`;

    if (!force) {
      const cached = ttlCache.get(cacheKey);
      const hit = Array.isArray(cached);
      if (isDev) {
        console.log('artists_cache_hit', hit, { page: safePage, size: safeSize });
      }
      if (hit) {
        return { data: { content: cached } };
      }
    }

    if (artistsInflight.has(inflightKey)) {
      return artistsInflight.get(inflightKey);
    }

    const run = api.get('/artists', {
      signal,
      params: { page: safePage, size: safeSize },
    }).then((res) => {
      const content = unwrapListData(res?.data);
      ttlCache.set(cacheKey, content, ttlMs);
      return { ...res, data: { content } };
    }).finally(() => {
      artistsInflight.delete(inflightKey);
    });
    artistsInflight.set(inflightKey, run);
    return run;
  },
  getByInitial: (letter, config = {}) => api.get(`/artists/initial/${letter}`, config),
  getById: (id, config = {}) => api.get(`/artists/${id}`, config),
  search: (query, config = {}) => api.get(`/artists/search?q=${query}`, config),
  searchLite: (query, limit = 20, config = {}) =>
    api.get('/artists/search', {
      ...config,
      params: {
        q: query,
        limit,
      },
    }),
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
