const toEnvelope = (value, ttlMs) => ({
  expireAt: Date.now() + ttlMs,
  value,
});

const parseEnvelope = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.expireAt !== 'number') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const ttlCache = {
  get(key) {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    const raw = window.sessionStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const envelope = parseEnvelope(raw);
    if (!envelope) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    if (envelope.expireAt <= Date.now()) {
      window.sessionStorage.removeItem(key);
      return null;
    }
    return envelope.value;
  },
  set(key, value, ttlMs) {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }
    window.sessionStorage.setItem(key, JSON.stringify(toEnvelope(value, ttlMs)));
  },
};

export const shortHash = (value) => {
  const text = String(value || '');
  let hash = 5381;
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

