const CHINA_TIME_ZONE = 'Asia/Shanghai';

const normalizeServerDateTime = (value) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(trimmed);
  const normalized = trimmed
    .replace(' ', 'T')
    .replace(/\.(\d{3})\d+/, '.$1');
  const isoLike = hasTimezone ? normalized : `${normalized}Z`;
  const date = new Date(isoLike);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatChinaDateTime = (value) => {
  const date = normalizeServerDateTime(value);
  if (!date) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
};

export const formatChinaDate = (value) => {
  const date = normalizeServerDateTime(value);
  if (!date) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: CHINA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};
