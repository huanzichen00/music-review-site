import api from './axios';

export const notificationsApi = {
  getMine: () => api.get('/notifications/my'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  createAnnouncement: (data) => api.post('/notifications/announcements', data),
};

