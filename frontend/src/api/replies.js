import api from './axios';

export const repliesApi = {
  // Get replies for a review
  getByReview: (reviewId) => api.get(`/replies/review/${reviewId}`),

  // Create a reply
  create: (data) => api.post('/replies', data),

  // Update a reply
  update: (id, content) => api.put(`/replies/${id}`, { content }),

  // Delete a reply
  delete: (id) => api.delete(`/replies/${id}`),
};
