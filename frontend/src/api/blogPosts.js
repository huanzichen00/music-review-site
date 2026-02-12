import api from './axios';

export const blogPostsApi = {
  getAll: () => api.get('/blog-posts'),
  getMine: () => api.get('/blog-posts/my'),
  getByUser: (userId) => api.get(`/blog-posts/user/${userId}`),
  create: (data) => api.post('/blog-posts', data),
  update: (id, data) => api.put(`/blog-posts/${id}`, data),
  delete: (id) => api.delete(`/blog-posts/${id}`),
};
