import api from './axios';

export const reviewsApi = {
  getRecent: () => api.get('/reviews/recent'),
  getByAlbum: (albumId) => api.get(`/reviews/album/${albumId}`),
  getMyReviews: () => api.get('/reviews/my'),
  getMyReviewForAlbum: (albumId) => api.get(`/reviews/my/${albumId}`),
  createOrUpdate: (data) => api.post('/reviews', data),
  delete: (id) => api.delete(`/reviews/${id}`),
  getStats: (albumId) => api.get(`/reviews/stats/${albumId}`),
};
