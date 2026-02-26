export const BILIBILI_DEFAULT_AVATAR_URL =
  '/bilibili-default-avatar.jpg';

export const resolveAvatarUrl = (url) => {
  if (!url) {
    return BILIBILI_DEFAULT_AVATAR_URL;
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/api') || url.startsWith('/')) {
    if (typeof window !== 'undefined') {
      return new URL(url, window.location.origin).toString();
    }
    return url;
  }

  if (typeof window !== 'undefined') {
    return new URL(`/api/files/avatars/${url}`, window.location.origin).toString();
  }

  return url;
};
