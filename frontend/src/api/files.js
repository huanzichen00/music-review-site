import api from './axios';

export const filesApi = {
  uploadAlbumCover: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/album-cover', formData);
  },
};
