const isAbsoluteHttpUrl = (url) => /^https?:\/\//i.test(String(url || ''));

export const resolveMediaUrl = (url) => {
  if (!url) {
    return '';
  }
  if (isAbsoluteHttpUrl(url)) {
    return url;
  }
  if (url.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return new URL(url, window.location.origin).toString();
    }
    return url;
  }
  return url;
};

const isNeteaseCoverUrl = (url) =>
  /:\/\/(?:p\d+|music)\.music\.126\.net\//i.test(String(url || ''));

const withNeteaseParam = (url, maxEdge) => {
  if (!url || !isNeteaseCoverUrl(url)) {
    return url;
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}param=${maxEdge}y${maxEdge}`;
};

export const getAlbumCoverCandidates = ({ albumId, coverUrl, variant = 'thumb' }) => {
  const edge = variant === 'detail' ? 600 : 300;
  const candidates = [];

  if (albumId != null && albumId !== '') {
    candidates.push(resolveMediaUrl(`/covers/${albumId}_${edge}.webp`));
  }

  const original = resolveMediaUrl(coverUrl);
  if (original) {
    const optimized = withNeteaseParam(original, edge);
    if (optimized) {
      candidates.push(optimized);
    }
    candidates.push(original);
  }

  return [...new Set(candidates.filter(Boolean))];
};
