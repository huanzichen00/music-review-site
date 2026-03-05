export const normalizeArtistSearchKeyword = (value) => (value || '').trim().toLowerCase();

export const makeArtistSearchCacheKey = (keyword, limit = 20) =>
  `${normalizeArtistSearchKeyword(keyword)}::${limit}`;
