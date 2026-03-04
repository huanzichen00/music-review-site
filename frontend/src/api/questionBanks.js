import api from './axios';
import { shortHash, ttlCache } from '../utils/ttlCache';

const QB_PUBLIC_CACHE_KEY = 'qb:public';
const QB_MINE_CACHE_KEY_PREFIX = 'qb:mine';
const inflight = new Map();
const isDev = import.meta.env.DEV;

const getCurrentUserId = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'anon';
    const user = JSON.parse(raw);
    return user?.id != null ? String(user.id) : 'anon';
  } catch {
    return 'anon';
  }
};

const getMineCacheKey = () => {
  const userId = getCurrentUserId();
  return `${QB_MINE_CACHE_KEY_PREFIX}:${userId}:${shortHash(userId)}`;
};

export const questionBanksApi = {
  getPublic: (config = {}) => api.get('/question-banks/public', config),
  getPublicCached: async ({ ttlMs = 60_000, force = false, signal } = {}) => {
    const inflightKey = 'public';
    if (!force) {
      const cached = ttlCache.get(QB_PUBLIC_CACHE_KEY);
      const hit = cached != null;
      if (isDev) {
        console.log('qb_public_cache_hit', hit);
      }
      if (hit) {
        return { data: cached };
      }
      if (inflight.has(inflightKey)) {
        return inflight.get(inflightKey);
      }
    }
    const run = api.get('/question-banks/public', { signal }).then((res) => {
      ttlCache.set(QB_PUBLIC_CACHE_KEY, res.data, ttlMs);
      return res;
    }).finally(() => {
      inflight.delete(inflightKey);
    });
    inflight.set(inflightKey, run);
    return run;
  },
  getPublicById: (id, config = {}) => api.get(`/question-banks/public/${id}`, config),
  getByShareToken: (shareToken, config = {}) => api.get(`/question-banks/share/${shareToken}`, config),
  getMine: (config = {}) => api.get('/question-banks/mine', config),
  getMineCached: async ({ ttlMs = 15_000, force = false, signal } = {}) => {
    const cacheKey = getMineCacheKey();
    const inflightKey = `mine:${cacheKey}`;
    if (!force) {
      const cached = ttlCache.get(cacheKey);
      const hit = cached != null;
      if (isDev) {
        console.log('qb_mine_cache_hit', hit);
      }
      if (hit) {
        return { data: cached };
      }
      if (inflight.has(inflightKey)) {
        return inflight.get(inflightKey);
      }
    }
    const run = api.get('/question-banks/mine', { signal }).then((res) => {
      ttlCache.set(cacheKey, res.data, ttlMs);
      return res;
    }).finally(() => {
      inflight.delete(inflightKey);
    });
    inflight.set(inflightKey, run);
    return run;
  },
  getMineById: (id, config = {}) => api.get(`/question-banks/${id}`, config),
  create: (data) => api.post('/question-banks', data),
  update: (id, data) => api.put(`/question-banks/${id}`, data),
  updateItems: (id, data) => api.put(`/question-banks/${id}/items`, data),
  remove: (id) => api.delete(`/question-banks/${id}`),
};
