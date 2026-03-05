const GUEST_BANKS_KEY = 'guest_question_banks_v1';

const parseJson = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const loadGuestQuestionBanks = () => {
  if (typeof window === 'undefined') {
    return [];
  }
  const parsed = parseJson(localStorage.getItem(GUEST_BANKS_KEY));
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .filter((item) => item && item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      visibility: item.visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
      artistIds: Array.isArray(item.artistIds) ? item.artistIds.filter((id) => Number.isFinite(Number(id))).map(Number) : [],
      ownerUsername: '游客',
      ownerUserId: null,
      shareToken: null,
      itemCount: Array.isArray(item.artistIds) ? item.artistIds.length : 0,
    }));
};

export const saveGuestQuestionBanks = (banks) => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(GUEST_BANKS_KEY, JSON.stringify(Array.isArray(banks) ? banks : []));
};

export const makeGuestBankId = () => `g_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
