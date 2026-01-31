import api from './axios';

export const importApi = {
  // Search albums from MusicBrainz
  searchAlbums: (album, artist, limit = 10) => {
    const params = new URLSearchParams();
    if (album) params.append('album', album);
    if (artist) params.append('artist', artist);
    params.append('limit', limit);
    return api.get(`/import/search?${params.toString()}`);
  },
  
  // Get album details with track list from MusicBrainz
  getAlbumDetails: (mbid) => api.get(`/import/album/${mbid}`),
  
  // Import from NetEase (may be restricted)
  fromNetease: (url) => api.get(`/import/netease?url=${encodeURIComponent(url)}`),
};
