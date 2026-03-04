const summarizeElement = (entry) => {
  const element = entry?.element;
  const text = (element?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
  return {
    tagName: element?.tagName || null,
    src: element?.currentSrc || element?.src || null,
    text: text || null,
    startTime: Number((entry?.startTime || 0).toFixed(2)),
    loadTime: Number((entry?.loadTime || 0).toFixed(2)),
    route: typeof window !== 'undefined' ? window.location.pathname : '',
  };
};

export const initLcpDebugLogger = () => {
  if (!import.meta.env.DEV || typeof window === 'undefined' || window.__lcpDebugInstalled) {
    return;
  }
  window.__lcpDebugInstalled = true;

  const print = (label, entry) => {
    if (!entry) {
      return;
    }
    console.log(label, summarizeElement(entry));
  };

  const existing = performance.getEntriesByType('largest-contentful-paint');
  if (existing.length > 0) {
    print('[LCP][entries]', existing[existing.length - 1]);
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        print('[LCP][observer]', entries[entries.length - 1]);
      }
    });
    observer.observe({ type: 'largest-contentful-paint', buffered: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        const latest = performance.getEntriesByType('largest-contentful-paint');
        if (latest.length > 0) {
          print('[LCP][final]', latest[latest.length - 1]);
        }
        observer.disconnect();
      }
    });
  } catch (error) {
    console.log('[LCP][observer-error]', String(error));
  }
};
