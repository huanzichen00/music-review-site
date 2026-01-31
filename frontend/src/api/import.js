import api from './axios';

export const importApi = {
  fromNetease: (url) => api.get(`/import/netease?url=${encodeURIComponent(url)}`),
};
