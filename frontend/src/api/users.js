import api from './axios';

export const usersApi = {
  // Get current user profile
  getMyProfile: () => api.get('/users/me'),
  
  // Update current user profile
  updateMyProfile: (data) => api.put('/users/me', data),
  
  // Get user profile by ID (public)
  getUserProfile: (id) => api.get(`/users/${id}`),
};
