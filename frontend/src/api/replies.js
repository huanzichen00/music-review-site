import api from './axios';

export const repliesApi = {
  // 获取某条评论下的回复
  getByReview: (reviewId) => api.get(`/replies/review/${reviewId}`),

  // 创建回复
  create: (data) => api.post('/replies', data),

  // 更新回复
  update: (id, content) => api.put(`/replies/${id}`, { content }),

  // 删除回复
  delete: (id) => api.delete(`/replies/${id}`),
};
