import api from './axios';
import { cachedApiGet, invalidateApiCache } from './cache';

const REVIEWS_RECENT_CACHE_KEY = 'reviews:getRecent';
const REVIEWS_RECENT_TTL_MS = 30 * 1000;

export const reviewsApi = {
  getRecent: (options = {}) =>
    cachedApiGet({
      key: REVIEWS_RECENT_CACHE_KEY,
      request: () => api.get('/reviews/recent'),
      ttlMs: REVIEWS_RECENT_TTL_MS,
      force: Boolean(options.force),
    }),
  getByAlbum: (albumId) => api.get(`/reviews/album/${albumId}`),
  getMyReviews: () => api.get('/reviews/my'),
  getMyReviewForAlbum: (albumId) => api.get(`/reviews/my/${albumId}`),
  createOrUpdate: async (data) => {
    const res = await api.post('/reviews', data);
    invalidateApiCache(REVIEWS_RECENT_CACHE_KEY);
    return res;
  },
  delete: async (id) => {
    const res = await api.delete(`/reviews/${id}`);
    invalidateApiCache(REVIEWS_RECENT_CACHE_KEY);
    return res;
  },
  getStats: (albumId) => api.get(`/reviews/stats/${albumId}`),
};
