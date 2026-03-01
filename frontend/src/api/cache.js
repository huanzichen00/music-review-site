const DEFAULT_TTL_MS = 60 * 1000;

const memoryCache = new Map();
const inflight = new Map();

const now = () => Date.now();

const safeParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const makeStorageKey = (key) => `api-cache:${key}`;

const readFromSessionStorage = (key) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }
  const raw = window.sessionStorage.getItem(makeStorageKey(key));
  if (!raw) {
    return null;
  }
  const parsed = safeParse(raw);
  if (!parsed || typeof parsed.expireAt !== 'number') {
    return null;
  }
  if (parsed.expireAt <= now()) {
    window.sessionStorage.removeItem(makeStorageKey(key));
    return null;
  }
  return parsed.value;
};

const writeToSessionStorage = (key, value, ttlMs) => {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }
  const payload = {
    value,
    expireAt: now() + ttlMs,
  };
  window.sessionStorage.setItem(makeStorageKey(key), JSON.stringify(payload));
};

const readFromMemory = (key) => {
  const cached = memoryCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expireAt <= now()) {
    memoryCache.delete(key);
    return null;
  }
  return cached.value;
};

const writeToMemory = (key, value, ttlMs) => {
  memoryCache.set(key, {
    value,
    expireAt: now() + ttlMs,
  });
};

export const invalidateApiCache = (key) => {
  memoryCache.delete(key);
  if (typeof window !== 'undefined' && window.sessionStorage) {
    window.sessionStorage.removeItem(makeStorageKey(key));
  }
};

export const cachedApiGet = async ({ key, request, ttlMs = DEFAULT_TTL_MS, force = false }) => {
  if (!force) {
    const memoryHit = readFromMemory(key);
    if (memoryHit != null) {
      return { data: memoryHit };
    }
    const storageHit = readFromSessionStorage(key);
    if (storageHit != null) {
      writeToMemory(key, storageHit, ttlMs);
      return { data: storageHit };
    }
  }

  const inflightKey = `${key}:${force ? 'force' : 'normal'}`;
  if (inflight.has(inflightKey)) {
    return inflight.get(inflightKey);
  }

  const run = request()
    .then((response) => {
      const value = response?.data;
      writeToMemory(key, value, ttlMs);
      writeToSessionStorage(key, value, ttlMs);
      return { data: value };
    })
    .finally(() => {
      inflight.delete(inflightKey);
    });

  inflight.set(inflightKey, run);
  return run;
};
