import api from './axios';

export const usersApi = {
  // 获取当前用户资料
  getMyProfile: () => api.get('/users/me'),
  
  // 更新当前用户资料
  updateMyProfile: (data) => api.put('/users/me', data),
  
  // 按用户 ID 获取公开资料
  getUserProfile: (id) => api.get(`/users/${id}`),

  // 上传头像
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
