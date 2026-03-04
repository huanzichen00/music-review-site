import api from './axios';
import { cachedApiGet, invalidateApiCache } from './cache';

const REVIEWS_RECENT_CACHE_KEY = 'reviews:getRecent';
const REVIEWS_RECENT_TTL_MS = 30 * 1000;

export const reviewsApi = {
  getRecent: (options = {}) =>
    cachedApiGet({
      key: REVIEWS_RECENT_CACHE_KEY,
      request: () => {
        const params = {};
        if (Number.isInteger(options.page)) {
          params.page = options.page;
        }
        if (Number.isInteger(options.size)) {
          params.size = options.size;
        }
        return api.get('/reviews/recent', {
          signal: options.signal,
          params: Object.keys(params).length > 0 ? params : undefined,
        });
      },
      ttlMs: REVIEWS_RECENT_TTL_MS,
      force: Boolean(options.force),
    }),
  getByAlbum: (albumId, config = {}) => api.get(`/reviews/album/${albumId}`, config),
  getMyReviews: (config = {}) => api.get('/reviews/my', config),
  getMyReviewForAlbum: (albumId, config = {}) => api.get(`/reviews/my/${albumId}`, config),
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
  getStats: (albumId, config = {}) => api.get(`/reviews/stats/${albumId}`, config),
};
