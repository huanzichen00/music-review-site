import api from './axios';

export const notificationsApi = {
  getMine: (options = {}) =>
    api.get('/notifications/my', {
      signal: options.signal,
      params: {
        page: Number.isInteger(options.page) ? options.page : 0,
        size: Number.isInteger(options.size) ? options.size : 100,
      },
    }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  createAnnouncement: (data) => api.post('/notifications/announcements', data),
};
