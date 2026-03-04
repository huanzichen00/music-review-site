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

export const isNeteaseCoverUrl = (url) =>
  /:\/\/(?:p\d+|music)\.music\.126\.net\//i.test(String(url || ''));

export const withNeteaseParam = (url, maxEdge) => {
  if (!url || !isNeteaseCoverUrl(url)) {
    return url;
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}param=${maxEdge}y${maxEdge}`;
};

export const getOptimizedCoverUrl = ({ coverUrl, variant = 'thumb' }) => {
  const edge = variant === 'detail' ? 600 : 300;
  const original = resolveMediaUrl(coverUrl);
  if (!original) {
    return '';
  }
  return withNeteaseParam(original, edge);
};

export const getAlbumCoverCandidates = ({
  albumId,
  coverUrl,
  variant = 'thumb',
  sourcePreference = 'local-first',
}) => {
  const edge = variant === 'detail' ? 600 : 300;
  const local = albumId != null && albumId !== '' ? resolveMediaUrl(`/covers/${albumId}_${edge}.webp`) : '';
  const original = resolveMediaUrl(coverUrl);
  const optimized = withNeteaseParam(original, edge);
  const remoteCandidates = [optimized, original].filter(Boolean);

  if (sourcePreference === 'remote-first') {
    return [...new Set([...remoteCandidates, local].filter(Boolean))];
  }

  return [...new Set([local, ...remoteCandidates].filter(Boolean))];
};
