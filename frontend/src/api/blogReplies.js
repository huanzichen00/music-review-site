import api from './axios';

export const blogRepliesApi = {
  getByPost: (postId, config = {}) => api.get(`/blog-replies/post/${postId}`, config),
  create: (data) => api.post('/blog-replies', data),
  update: (id, content) => api.put(`/blog-replies/${id}`, { content }),
  delete: (id) => api.delete(`/blog-replies/${id}`),
};

