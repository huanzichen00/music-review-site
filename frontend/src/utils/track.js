const TRACK_API = '/api/event';

export const track = (event, page) => {
  if (!event || !page) {
    return;
  }

  fetch(TRACK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ event, page }),
    keepalive: true,
    cache: 'no-store',
  }).catch(() => {});
};
