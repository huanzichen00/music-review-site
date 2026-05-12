import api from './axios';

export const importApi = {
  // 从 MusicBrainz 搜索专辑
  searchAlbums: (album, artist, limit = 10) => {
    const params = new URLSearchParams();
    if (album) params.append('album', album);
    if (artist) params.append('artist', artist);
    params.append('limit', limit);
    return api.get(`/import/search?${params.toString()}`);
  },
  
  // 从 MusicBrainz 获取带曲目列表的专辑详情
  getAlbumDetails: (mbid) => api.get(`/import/album/${mbid}`),
  
  // 从网易云导入（可能受限制）
  fromNetease: (url) => api.get(`/import/netease?url=${encodeURIComponent(url)}`),
};
