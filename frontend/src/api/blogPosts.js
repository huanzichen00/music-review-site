import api from './axios';

export const blogPostsApi = {
  getAll: (options = {}) =>
    api.get('/blog-posts', {
      signal: options.signal,
      params: {
        page: Number.isInteger(options.page) ? options.page : 0,
        size: Number.isInteger(options.size) ? options.size : 50,
      },
    }),
  getMine: (options = {}) =>
    api.get('/blog-posts/my', {
      signal: options.signal,
      params: {
        page: Number.isInteger(options.page) ? options.page : 0,
        size: Number.isInteger(options.size) ? options.size : 50,
      },
    }),
  getByUser: (userId, options = {}) =>
    api.get(`/blog-posts/user/${userId}`, {
      signal: options.signal,
      params: {
        page: Number.isInteger(options.page) ? options.page : 0,
        size: Number.isInteger(options.size) ? options.size : 50,
      },
    }),
  create: (data) => api.post('/blog-posts', data),
  update: (id, data) => api.put(`/blog-posts/${id}`, data),
  delete: (id) => api.delete(`/blog-posts/${id}`),
};
