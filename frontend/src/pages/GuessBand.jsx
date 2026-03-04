import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AutoComplete, Button, Card, Input, InputNumber, Select, Space, Spin, Tag, Typography, message } from 'antd';
import {
  TrophyOutlined,
  ReloadOutlined,
  RocketOutlined,
  AppstoreOutlined,
  TagsOutlined,
  CalendarOutlined,
  CaretUpFilled,
  CaretDownFilled,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { artistsApi } from '../api/artists';
import { questionBanksApi } from '../api/questionBanks';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';

const { Title, Text } = Typography;
const DEFAULT_MAX_ATTEMPTS = 10;

const styles = {
  wrapper: {
    maxWidth: 1320,
    margin: '0 auto',
  },
  layoutRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  sideCard: {
    width: 220,
    flex: '1 1 220px',
    borderRadius: 16,
    border: '1px solid #CBD5E1',
    background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
    boxShadow: '0 4px 14px rgba(51, 65, 85, 0.1)',
  },
  sideTitle: {
    marginBottom: 10,
    color: '#334155',
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
  },
  sideSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 1.6,
  },
  centerWrap: {
    flex: '3 1 720px',
    minWidth: 0,
  },
  heroCard: {
    borderRadius: 16,
    border: '1px solid #CBD5E1',
    background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
    boxShadow: '0 6px 18px rgba(51, 65, 85, 0.12)',
    overflow: 'hidden',
  },
  title: {
    marginTop: 12,
    marginBottom: 10,
    color: '#1E293B',
    fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  subtitle: {
    color: '#475569',
    fontSize: 16,
  },
  artistsLinkButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(0, 170, 102, 0.3)',
    background: 'linear-gradient(135deg, #00C853 0%, #00A65A 100%)',
    border: 'none',
    color: '#FDF5ED',
  },
  genresLinkButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(255, 145, 0, 0.32)',
    background: 'linear-gradient(135deg, #FFB300 0%, #FB8C00 100%)',
    border: 'none',
    color: '#FDF5ED',
  },
  yearsLinkButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(176, 95, 48, 0.32)',
    background: 'linear-gradient(135deg, #D58C52 0%, #B25F30 100%)',
    border: 'none',
    color: '#FDF5ED',
  },
  banksLinkButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
    background: 'linear-gradient(135deg, #64748B 0%, #475569 100%)',
    border: 'none',
    color: '#FDF5ED',
  },
  actionRow: {
    marginTop: 18,
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  board: {
    marginTop: 16,
    background: 'linear-gradient(180deg, #4A2C40 0%, #59364C 100%)',
    borderRadius: 14,
    padding: 10,
    border: '1px solid #6E4A5F',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '6px',
    tableLayout: 'fixed',
  },
  th: {
    background: '#F7F8FA',
    color: '#5A6472',
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 12,
    border: '1px solid #D9DEE6',
    letterSpacing: '0.4px',
  },
  tdBase: {
    padding: '12px 8px',
    textAlign: 'center',
    borderRadius: 12,
    color: '#F7F1F5',
    fontWeight: 600,
    fontSize: 13,
    background: '#5A3A4E',
  },
  answerCard: {
    marginTop: 16,
    borderRadius: 18,
    border: '1px solid #CBD5E1',
    background: 'linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%)',
  },
  highlightTip: {
    marginTop: 14,
    borderRadius: 18,
    border: '1px solid #CBD5E1',
    background: 'linear-gradient(90deg, #F8FAFC 0%, #F1F5F9 100%)',
    color: '#334155',
    fontWeight: 700,
  },
};

const CATEGORY_GROUPS = {
  UK: 'EU',
  Ireland: 'EU',
  Germany: 'EU',
  Italy: 'EU',
  US: 'NA',
  Australia: 'OC',
  Japan: 'JP',
  华语: 'CN',
};

const GENRE_GROUPS = {
  Rock: 'ROCK',
  'Hard Rock': 'ROCK',
  'Progressive Rock': 'ROCK',
  'Alternative Rock': 'ALT',
  'Indie Rock': 'ALT',
  'Funk Rock': 'ALT',
  Britpop: 'ALT',
  'Post Punk': 'ALT',
  'Nu Metal': 'METAL',
  'Industrial Metal': 'METAL',
  Metal: 'METAL',
  Grunge: 'ALT',
  'Punk Rock': 'PUNK',
  'Pop Punk': 'PUNK',
  'Pop Rock': 'POP',
  'Indie Pop': 'POP',
  'New Wave': 'ALT',
  'Folk Rock': 'ALT',
};

const pickRandomBand = (bands, excludeBand = null) => {
  if (!bands.length) {
    return null;
  }
  if (bands.length <= 1) {
    return bands[0];
  }
  const filtered = excludeBand
    ? bands.filter((band) => band.name !== excludeBand.name)
    : bands;
  return filtered[Math.floor(Math.random() * filtered.length)];
};

const normalizeBand = (value) => value.trim().toLowerCase();
const startsWithLatinLetter = (value) => /^[A-Za-z]/.test((value || '').trim());

const compareCategory = (guessValue, targetValue, groupMap = null) => {
  if (guessValue === targetValue) {
    return 'exact';
  }
  if (groupMap && groupMap[guessValue] && groupMap[guessValue] === groupMap[targetValue]) {
    return 'close';
  }
  return 'miss';
};

const compareNumber = (guessValue, targetValue, closeDistance) => {
  if (guessValue === targetValue) {
    return { state: 'exact', arrow: '' };
  }
  const arrow = guessValue < targetValue ? '↑' : '↓';
  const state = Math.abs(guessValue - targetValue) <= closeDistance ? 'close' : 'miss';
  return { state, arrow };
};

const buildGuessResult = (guessBand, targetBand) => {
  const regionState = compareCategory(guessBand.region, targetBand.region, CATEGORY_GROUPS);
  const genreState = compareCategory(guessBand.genre, targetBand.genre, GENRE_GROUPS);
  const year = compareNumber(guessBand.yearFormed, targetBand.yearFormed, 5);
  const members = compareNumber(guessBand.members, targetBand.members, 1);
  const statusState = compareCategory(guessBand.status, targetBand.status);

  return {
    bandName: guessBand.name,
    region: { value: guessBand.region, state: regionState },
    genre: { value: guessBand.genre, state: genreState },
    year: { value: guessBand.yearFormed, state: year.state, arrow: year.arrow },
    members: { value: guessBand.members, state: members.state, arrow: members.arrow },
    status: { value: guessBand.status, state: statusState },
    correct: guessBand.name === targetBand.name,
  };
};

const isPlayableArtist = (artist) =>
  Boolean(
    artist?.name &&
      artist?.country &&
      artist?.formedYear &&
      artist?.genre &&
      artist?.memberCount &&
      artist?.status
  );

const unwrapListData = (data) => {
  if (Array.isArray(data?.content)) {
    return data.content;
  }
  return Array.isArray(data) ? data : [];
};

const toGameBand = (artist) => ({
  name: artist.name.trim(),
  region: artist.country.trim(),
  genre: artist.genre.trim(),
  yearFormed: artist.formedYear,
  members: artist.memberCount,
  status: artist.status.trim(),
});

const safeMark = (name) => {
  if (typeof performance === 'undefined' || typeof performance.mark !== 'function') {
    return;
  }
  try {
    performance.mark(name);
  } catch {
    // ignore
  }
};

const GuessBand = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const isBlue = theme === 'blue';
  const isDark = theme === 'dark';
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bankSwitching, setBankSwitching] = useState(false);
  const [allBands, setAllBands] = useState([]);
  const [bankOptions, setBankOptions] = useState([]);
  const [currentBankKey, setCurrentBankKey] = useState('default');
  const [currentBankLabel, setCurrentBankLabel] = useState('默认题库');
  const [shareBank, setShareBank] = useState(null);
  const [targetBand, setTargetBand] = useState(null);
  const [guessInput, setGuessInput] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [solved, setSolved] = useState(false);
  const [roundOver, setRoundOver] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(DEFAULT_MAX_ATTEMPTS);
  const [countryInput, setCountryInput] = useState('');
  const firstInteractiveLoggedRef = useRef(false);
  const navIdRef = useRef(null);
  const mountMarkedRef = useRef(false);

  if (!mountMarkedRef.current) {
    mountMarkedRef.current = true;
    safeMark('gb_chunk_loaded');
    if (typeof window !== 'undefined') {
      const metrics = window.__gb_metrics || {};
      navIdRef.current = metrics.navId || null;
      window.__gb_metrics = {
        ...metrics,
        chunkLoadedAt: performance.now(),
      };
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const previous = window.__gb_metrics || {};
    window.__gb_metrics = {
      ...previous,
      listBuildMs: [],
      marksAt: {
        ...(previous.marksAt || {}),
      },
    };
  }, []);
  const indexedBands = useMemo(
    () =>
      bands.map((band) => ({
        ...band,
        normalizedName: normalizeBand(band.name),
      })),
    [bands]
  );
  const bandLookup = useMemo(() => {
    const map = new Map();
    indexedBands.forEach((band) => map.set(band.normalizedName, band));
    return map;
  }, [indexedBands]);
  const sortedBands = useMemo(
    () =>
      indexedBands.slice().sort((a, b) => {
        const aIsLetter = startsWithLatinLetter(a.name);
        const bIsLetter = startsWithLatinLetter(b.name);
        if (aIsLetter !== bIsLetter) {
          return aIsLetter ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }),
    [indexedBands]
  );
  const normalizedCountryInput = useMemo(() => countryInput.trim().toLowerCase(), [countryInput]);
  const countryFilteredBands = useMemo(() => {
    if (!normalizedCountryInput) {
      return sortedBands;
    }
    return sortedBands.filter((band) => (band.region || '').toLowerCase().includes(normalizedCountryInput));
  }, [normalizedCountryInput, sortedBands]);
  const visibleBands = useMemo(() => countryFilteredBands.slice(0, 240), [countryFilteredBands]);

  const themedStyles = useMemo(() => {
    if (isDark) {
      return {
        ...styles,
        sideCard: {
          ...styles.sideCard,
          border: '1px solid #2F2F33',
          background: 'linear-gradient(180deg, #161618 0%, #121214 100%)',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)',
        },
        sideTitle: { ...styles.sideTitle, color: '#E5E7EB' },
        sideSubtitle: { ...styles.sideSubtitle, color: '#9CA3AF' },
        heroCard: {
          ...styles.heroCard,
          border: '1px solid #2F2F33',
          background: 'linear-gradient(180deg, #161618 0%, #121214 100%)',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.45)',
        },
        title: { ...styles.title, color: '#E5E7EB' },
        subtitle: { ...styles.subtitle, color: '#A3A3A3' },
        artistsLinkButton: {
          ...styles.artistsLinkButton,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.32)',
          background: 'linear-gradient(135deg, #4B5563 0%, #374151 100%)',
          color: '#E5E7EB',
        },
        genresLinkButton: {
          ...styles.genresLinkButton,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.32)',
          background: 'linear-gradient(135deg, #52525B 0%, #3F3F46 100%)',
          color: '#E5E7EB',
        },
        yearsLinkButton: {
          ...styles.yearsLinkButton,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.32)',
          background: 'linear-gradient(135deg, #4B5563 0%, #374151 100%)',
          color: '#E5E7EB',
        },
        banksLinkButton: {
          ...styles.banksLinkButton,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.32)',
          background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
          color: '#E5E7EB',
        },
        board: {
          ...styles.board,
          background: 'linear-gradient(180deg, #0F0F10 0%, #141416 100%)',
          border: '1px solid #2F2F33',
        },
        th: {
          ...styles.th,
          background: '#23262D',
          color: '#D6DBE4',
          border: '1px solid #3C424F',
        },
        tdBase: { ...styles.tdBase, background: '#18181B', color: '#E5E7EB' },
        answerCard: {
          ...styles.answerCard,
          border: '1px solid #3F3F46',
          background: 'linear-gradient(180deg, #17171A 0%, #131316 100%)',
        },
        highlightTip: {
          ...styles.highlightTip,
          border: '1px solid #3F3F46',
          background: 'linear-gradient(90deg, #1A1A1D 0%, #16161A 100%)',
          color: '#D1D5DB',
        },
      };
    }
    if (!isBlue) {
      return styles;
    }
    return {
      ...styles,
      sideCard: {
        ...styles.sideCard,
        border: '1px solid #C9DDFB',
        background: 'linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 100%)',
        boxShadow: '0 4px 14px rgba(30, 79, 158, 0.08)',
      },
      sideTitle: { ...styles.sideTitle, color: '#274B7A' },
      sideSubtitle: { ...styles.sideSubtitle, color: '#6788AE' },
      heroCard: {
        ...styles.heroCard,
        border: '1px solid #C9DDFB',
        background: 'linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 100%)',
        boxShadow: '0 6px 18px rgba(30, 79, 158, 0.1)',
      },
      title: { ...styles.title, color: '#1F3F6B' },
      subtitle: { ...styles.subtitle, color: '#4D6F99' },
      artistsLinkButton: {
        ...styles.artistsLinkButton,
        boxShadow: '0 4px 12px rgba(60, 120, 210, 0.24)',
        background: 'linear-gradient(135deg, #4B93FF 0%, #2E74DD 100%)',
        color: '#EEF4FF',
      },
      genresLinkButton: {
        ...styles.genresLinkButton,
        boxShadow: '0 4px 12px rgba(70, 110, 190, 0.24)',
        background: 'linear-gradient(135deg, #5D8EEB 0%, #406DC6 100%)',
        color: '#EEF4FF',
      },
      yearsLinkButton: {
        ...styles.yearsLinkButton,
        boxShadow: '0 4px 12px rgba(70, 105, 170, 0.24)',
        background: 'linear-gradient(135deg, #6A96E8 0%, #4F73BE 100%)',
        color: '#EEF4FF',
      },
      banksLinkButton: {
        ...styles.banksLinkButton,
        boxShadow: '0 4px 12px rgba(70, 105, 170, 0.24)',
        background: 'linear-gradient(135deg, #6A96E8 0%, #4F73BE 100%)',
        color: '#EEF4FF',
      },
      board: {
        ...styles.board,
        background: 'linear-gradient(180deg, #10243F 0%, #142B4A 100%)',
        border: '1px solid #2A4F82',
      },
      th: {
        ...styles.th,
        background: '#F4F7FC',
        color: '#51607A',
        border: '1px solid #C9D2E3',
      },
      tdBase: { ...styles.tdBase, background: '#122742', color: '#EDF3FF' },
      answerCard: {
        ...styles.answerCard,
        border: '1px solid #9EC2F7',
        background: 'linear-gradient(180deg, #EEF5FF 0%, #E3EEFF 100%)',
      },
      highlightTip: {
        ...styles.highlightTip,
        border: '1px solid #8CB6F3',
        background: 'linear-gradient(90deg, #EEF5FF 0%, #DCEBFF 100%)',
        color: '#1E4A8A',
      },
    };
  }, [isBlue, isDark]);

  const getCellStyleByTheme = (state) => {
    if (state === 'exact') {
      return { background: isDark ? '#2C6660' : isBlue ? '#2A8F87' : '#1F8A70' };
    }
    if (state === 'close') {
      return { background: isDark ? '#52525B' : isBlue ? '#3D79BF' : '#7A5A35' };
    }
    return { background: isDark ? '#18181B' : isBlue ? '#122742' : '#5A3A4E' };
  };

  const renderTrendArrow = (arrow) => {
    if (!arrow) return null;
    const isUp = arrow === '↑';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: 999,
          background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.2)',
        }}
      >
        {isUp ? <CaretUpFilled style={{ fontSize: 10 }} /> : <CaretDownFilled style={{ fontSize: 10 }} />}
      </span>
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    const loadBands = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const shareToken = params.get('share');
        safeMark('gb_api_start');
        if (typeof window !== 'undefined') {
          const metrics = window.__gb_metrics || {};
          if (!navIdRef.current || metrics.navId === navIdRef.current) {
            window.__gb_metrics = {
              ...metrics,
              apiStartAt: performance.now(),
            };
          }
        }

        const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

        const artistsPromise = (async () => {
          const s = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const res = await artistsApi.getAllCached({ signal: controller.signal, page: 0, size: 200, ttlMs: 30_000 });
          const e = typeof performance !== 'undefined' ? performance.now() : Date.now();
          console.log('artists_ms', Number((e - s).toFixed(2)));
          return res;
        })();

        const publicPromise = (async () => {
          const s = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const res = await questionBanksApi.getPublicCached({ signal: controller.signal });
          const e = typeof performance !== 'undefined' ? performance.now() : Date.now();
          console.log('qb_public_ms', Number((e - s).toFixed(2)));
          return res;
        })();

        const minePromise = (async () => {
          const s = typeof performance !== 'undefined' ? performance.now() : Date.now();
          const res = isAuthenticated
            ? await questionBanksApi.getMineCached({ signal: controller.signal })
            : { data: [] };
          const e = typeof performance !== 'undefined' ? performance.now() : Date.now();
          console.log('qb_mine_ms', Number((e - s).toFixed(2)));
          return res;
        })();

        const [artistsRes, publicBanksRes, mineBanksRes] = await Promise.all([
          artistsPromise,
          publicPromise,
          minePromise,
        ]);
        const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now();
        console.log('api_total_ms', Number((t1 - t0).toFixed(2)));
        safeMark('gb_api_done');
        if (typeof window !== 'undefined') {
          const metrics = window.__gb_metrics || {};
          if (!navIdRef.current || metrics.navId === navIdRef.current) {
            window.__gb_metrics = {
              ...metrics,
              apiDoneAt: performance.now(),
            };
          }
        }

        const gameBands = unwrapListData(artistsRes.data).filter(isPlayableArtist).map(toGameBand);
        setAllBands(gameBands);

        const allPublicBanks = publicBanksRes.data || [];
        const mineBanks = mineBanksRes.data || [];
        const visiblePublicBanks = allPublicBanks.filter((bank) => {
          if (!isAuthenticated) {
            return true;
          }
          if (user?.id != null && bank.ownerUserId != null) {
            return bank.ownerUserId !== user.id;
          }
          if (user?.username && bank.ownerUsername) {
            return bank.ownerUsername !== user.username;
          }
          return true;
        });
        const mineOptions = mineBanks.map((bank) => ({
          value: `mine:${bank.id}`,
          label: `${bank.name} (${bank.itemCount || 0})`,
        }));
        const publicOptions = visiblePublicBanks.map((bank) => ({
          value: `public:${bank.id}`,
          label: `公开 · ${bank.name}（${bank.ownerUsername || '匿名'}） (${bank.itemCount || 0})`,
        }));

        let nextOptions = [{ value: 'default', label: `默认题库 (${gameBands.length})` }, ...mineOptions, ...publicOptions];
        let nextBands = gameBands;
        let nextBankKey = 'default';
        let nextBankLabel = '默认题库';

        if (shareToken) {
          try {
            const shareRes = await questionBanksApi.getByShareToken(shareToken, { signal: controller.signal });
            const sharedDetail = shareRes.data;
            const sharedBands = (sharedDetail?.artists || []).filter(isPlayableArtist).map(toGameBand);
            if (sharedBands.length > 0) {
              setShareBank(sharedDetail);
              nextBands = sharedBands;
              nextBankKey = `share:${sharedDetail.shareToken}`;
              nextBankLabel = `${sharedDetail.name}（分享）`;
              nextOptions = [...nextOptions, { value: nextBankKey, label: `${nextBankLabel} (${sharedBands.length})` }];
            } else {
              message.warning('分享题库暂无可用题目，已回退默认题库');
            }
          } catch (error) {
            if (!isRequestCanceled(error)) {
              message.warning('分享题库加载失败，已回退默认题库');
            }
          }
        }

        setBankOptions(nextOptions);
        setBands(nextBands);
        setCurrentBankKey(nextBankKey);
        setCurrentBankLabel(nextBankLabel);
        setTargetBand(pickRandomBand(nextBands));
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }
        message.error('加载乐队数据失败');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadBands();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [isAuthenticated, location.search, user?.id, user?.username]);

  useEffect(() => {
    if (!roundOver && !solved && attempts.length >= maxAttempts && attempts.length > 0) {
      setRoundOver(true);
      if (targetBand) {
        message.error(`本轮最多尝试 ${maxAttempts} 次，答案是 ${targetBand.name}`);
      }
    }
  }, [attempts.length, maxAttempts, roundOver, solved, targetBand]);

  useEffect(() => {
    if (loading || firstInteractiveLoggedRef.current) {
      return;
    }
    firstInteractiveLoggedRef.current = true;
    safeMark('gb_first_commit');

    const metrics = typeof window !== 'undefined' ? (window.__gb_metrics || {}) : {};
    const firstCommitAt = typeof performance !== 'undefined' ? performance.now() : null;
    if (typeof window !== 'undefined') {
      window.__gb_metrics = {
        ...metrics,
        firstCommitAt,
      };
    }

    const chunkPrefetched =
      typeof metrics.routeStartAt === 'number' &&
      typeof metrics.chunkLoadedAt === 'number' &&
      metrics.chunkLoadedAt < metrics.routeStartAt;
    const effectiveChunkAt =
      typeof metrics.chunkLoadedAt === 'number' && typeof metrics.routeStartAt === 'number'
        ? Math.max(metrics.chunkLoadedAt, metrics.routeStartAt)
        : metrics.chunkLoadedAt;
    const routeToChunk =
      typeof metrics.routeStartAt === 'number' && typeof effectiveChunkAt === 'number'
        ? Math.max(0, effectiveChunkAt - metrics.routeStartAt)
        : null;
    const chunkToApiDone =
      typeof effectiveChunkAt === 'number' && typeof metrics.apiDoneAt === 'number'
        ? Math.max(0, metrics.apiDoneAt - effectiveChunkAt)
        : null;
    const apiToCommit =
      typeof metrics.apiDoneAt === 'number' && typeof firstCommitAt === 'number'
        ? Math.max(0, firstCommitAt - metrics.apiDoneAt)
        : null;
    const total =
      typeof metrics.routeStartAt === 'number' && typeof firstCommitAt === 'number'
        ? Math.max(0, firstCommitAt - metrics.routeStartAt)
        : null;

    const listBuildMs = Array.isArray(metrics.listBuildMs) ? metrics.listBuildMs : [];
    const latestListBuild = listBuildMs.length ? listBuildMs[listBuildMs.length - 1] : null;
    const maxListBuild = listBuildMs.length ? Math.max(...listBuildMs) : null;

    console.table({
      route_to_chunk_ms: routeToChunk == null ? 'n/a' : Number(routeToChunk.toFixed(2)),
      chunk_to_api_done_ms: chunkToApiDone == null ? 'n/a' : Number(chunkToApiDone.toFixed(2)),
      api_to_commit_ms: apiToCommit == null ? 'n/a' : Number(apiToCommit.toFixed(2)),
      total_ms: total == null ? 'n/a' : Number(total.toFixed(2)),
      chunk_prefetched: chunkPrefetched,
      list_build_latest_ms: latestListBuild == null ? 'n/a' : latestListBuild,
      list_build_max_ms: maxListBuild == null ? 'n/a' : Number(maxListBuild.toFixed(2)),
      visible_bands_count: visibleBands.length,
    });
  }, [loading, visibleBands.length]);

  const filteredBands = useMemo(() => {
    const keyword = normalizeBand(guessInput);
    if (!keyword) {
      return sortedBands;
    }
    return sortedBands
      .filter((band) => band.normalizedName.includes(keyword))
      .slice(0, 50);
  }, [sortedBands, guessInput]);
  const visibleBandButtons = useMemo(
    () => {
      const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
      const nodes = visibleBands.map((band) => (
        <Button
          key={`bank-band-${band.name}`}
          type="text"
          onClick={() => setGuessInput(band.name)}
          style={{
            width: '100%',
            justifyContent: 'flex-start',
            paddingInline: 8,
            color: isDark ? '#E5E7EB' : '#1F2937',
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{band.name}</span>
        </Button>
      ));
      const t1 = typeof performance !== 'undefined' ? performance.now() : 0;
      if (typeof window !== 'undefined') {
        const metrics = window.__gb_metrics || {};
        const listBuildMs = Array.isArray(metrics.listBuildMs) ? metrics.listBuildMs : [];
        listBuildMs.push(Number((t1 - t0).toFixed(2)));
        window.__gb_metrics = {
          ...metrics,
          listBuildMs: listBuildMs.slice(-20),
        };
      }
      return nodes;
    },
    [isDark, visibleBands]
  );

  const resetRoundWithBands = (nextBands, excludeCurrent = false) => {
    setGuessInput('');
    setAttempts([]);
    setSolved(false);
    setRoundOver(false);
    setCountryInput('');
    setTargetBand((prevTarget) => pickRandomBand(nextBands, excludeCurrent ? prevTarget : null));
  };

  const handleBankChange = async (value) => {
    if (value === currentBankKey) {
      return;
    }

    if (value === 'default') {
      setCurrentBankKey('default');
      setCurrentBankLabel('默认题库');
      setBands(allBands);
      resetRoundWithBands(allBands);
      return;
    }

    if (value.startsWith('share:') && shareBank) {
      const sharedBands = (shareBank.artists || []).filter(isPlayableArtist).map(toGameBand);
      if (!sharedBands.length) {
        message.warning('分享题库暂无可用题目');
        return;
      }
      setCurrentBankKey(value);
      setCurrentBankLabel(`${shareBank.name}（分享）`);
      setBands(sharedBands);
      resetRoundWithBands(sharedBands);
      return;
    }

    if (value.startsWith('public:')) {
      const id = Number(value.replace('public:', ''));
      if (!id) {
        return;
      }
      try {
        setBankSwitching(true);
        const detailRes = await questionBanksApi.getPublicById(id);
        const detail = detailRes.data;
        const nextBands = (detail.artists || []).filter(isPlayableArtist).map(toGameBand);
        if (!nextBands.length) {
          message.warning('该公开题库暂无可用题目');
          return;
        }
        setCurrentBankKey(value);
        setCurrentBankLabel(`${detail.name}（${detail.ownerUsername || '匿名'}）`);
        setBands(nextBands);
        resetRoundWithBands(nextBands);
      } catch {
        message.error('加载公开题库失败');
      } finally {
        setBankSwitching(false);
      }
      return;
    }

    if (!value.startsWith('mine:')) {
      return;
    }

    const id = Number(value.replace('mine:', ''));
    if (!id) {
      return;
    }

    try {
      setBankSwitching(true);
      const detailRes = await questionBanksApi.getMineById(id);
      const detail = detailRes.data;
      const nextBands = (detail.artists || []).filter(isPlayableArtist).map(toGameBand);
      if (!nextBands.length) {
        message.warning('该题库暂无可用题目');
        return;
      }
      setCurrentBankKey(value);
      setCurrentBankLabel(detail.name);
      setBands(nextBands);
      resetRoundWithBands(nextBands);
    } catch {
      message.error('加载题库失败');
    } finally {
      setBankSwitching(false);
    }
  };

  const restartRound = () => {
    resetRoundWithBands(bands, true);
  };

  const submitGuess = (inputValue = guessInput) => {
    const finalInput = typeof inputValue === 'string' ? inputValue : guessInput;
    if (!finalInput.trim()) {
      message.warning('先输入一个乐队名');
      return;
    }
    if (roundOver) {
      message.info(
        solved
          ? '这一轮已经猜中，点击“下一题”开始新一轮'
          : `本轮已用完 ${maxAttempts} 次机会，点击“下一题”开始新一轮`
      );
      return;
    }
    if (!targetBand) {
      message.warning('乐队题库未就绪');
      return;
    }

    const normalizedInput = normalizeBand(finalInput);
    const matchedBand = bandLookup.get(normalizedInput);

    if (!matchedBand) {
      message.warning('请从乐队库里选择一个名字（可参考下方联想）');
      return;
    }

    const duplicated = attempts.some((attempt) => normalizeBand(attempt.bandName) === normalizedInput);
    if (duplicated) {
      message.warning('这个乐队你已经猜过了');
      return;
    }

    const resultRow = buildGuessResult(matchedBand, targetBand);
    const isCorrect = resultRow.correct;
    const nextAttempts = [resultRow, ...attempts];
    setAttempts(nextAttempts);
    setGuessInput('');

    if (isCorrect) {
      setSolved(true);
      setRoundOver(true);
      message.success(`猜中了！答案是 ${targetBand.name}`);
      return;
    }

    if (nextAttempts.length >= maxAttempts) {
      setRoundOver(true);
      message.error(`本轮最多尝试 ${maxAttempts} 次，答案是 ${targetBand.name}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="guess-band-page" style={themedStyles.wrapper}>
      <div className="guess-band-layout-row" style={themedStyles.layoutRow}>
        <Card className="guess-band-side-card guess-band-filter-card" style={themedStyles.sideCard}>
          <Title level={4} style={themedStyles.sideTitle}>
            国家筛选
          </Title>
          <Input
            placeholder="输入国家/地区，如 UK、US、华语"
            value={countryInput}
            onChange={(event) => setCountryInput(event.target.value)}
            allowClear
          />
          <div style={{ marginTop: 14 }}>
            <Text strong style={{ color: isDark ? '#E5E7EB' : isBlue ? '#274B7A' : '#334155' }}>当前题库乐队</Text>
            <Text style={{ ...themedStyles.sideSubtitle, display: 'block' }}>
              {countryFilteredBands.length} 支{countryFilteredBands.length > visibleBands.length ? `（仅显示前 ${visibleBands.length} 条）` : ''}
            </Text>
          </div>
          <div style={{ marginTop: 10 }}>
            <div
              className="guess-band-current-bands-scroll"
              style={{
                height: 320,
                overflowY: 'auto',
                borderRadius: 8,
                border: isDark ? '1px solid #2F2F33' : '1px solid #CBD5E1',
                background: isDark ? '#121214' : '#FFFFFF',
                padding: '6px 8px',
              }}
            >
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {visibleBandButtons}
              </Space>
            </div>
          </div>
        </Card>

        <div className="guess-band-center-wrap" style={themedStyles.centerWrap}>
          <Card className="guess-band-hero-card" style={themedStyles.heroCard}>
        <Space className="guess-band-meta-row" size="middle" wrap>
          <Tag color={isDark ? 'default' : 'success'}>默认 {DEFAULT_MAX_ATTEMPTS} 次</Tag>
          <Tag color={isDark ? 'default' : 'geekblue'}>乐队库 {bands.length} 支</Tag>
          <Tag color={isDark ? 'default' : 'processing'}>当前题库：{currentBankLabel}</Tag>
          <Text strong>本轮尝试 {attempts.length}/{maxAttempts} 次</Text>
          <Space size={6} align="center">
            <Text>上限</Text>
            <InputNumber
              min={1}
              max={100}
              value={maxAttempts}
              onChange={(value) => {
                if (typeof value === 'number') {
                  setMaxAttempts(value);
                }
              }}
              disabled={roundOver}
              size="small"
            />
            <Text>次</Text>
          </Space>
          <Space size={6} align="center">
            <Text>切换题库</Text>
            <Select
              className="guess-band-bank-select"
              value={currentBankKey}
              options={bankOptions}
              onChange={handleBankChange}
              loading={bankSwitching}
              style={{ minWidth: 240 }}
            />
          </Space>
        </Space>

        <div className="guess-band-title-row" style={styles.titleRow}>
          <div>
            <Title level={1} style={themedStyles.title}>
              猜乐队
            </Title>
            <Text style={themedStyles.subtitle}>
              支持默认题库、你的自选题库和分享题库。每轮最多猜 {maxAttempts} 次，猜中或用尽机会后可开始下一题。
            </Text>
          </div>
          <Space className="guess-band-links-row" size={10} wrap>
            <Button
              type="primary"
              size="large"
              icon={<AppstoreOutlined />}
              href="/music/artists"
              target="_blank"
              rel="noopener noreferrer"
              style={themedStyles.artistsLinkButton}
            >
              查看所有乐队
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<TagsOutlined />}
              href="/music/genres"
              target="_blank"
              rel="noopener noreferrer"
              style={themedStyles.genresLinkButton}
            >
              查看所有风格
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CalendarOutlined />}
              href="/music/years"
              target="_blank"
              rel="noopener noreferrer"
              style={themedStyles.yearsLinkButton}
            >
              查看所有年份
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<TrophyOutlined />}
              href="/music/guess-band/online"
              style={themedStyles.banksLinkButton}
            >
              联机模式
            </Button>
            {isAuthenticated ? (
              <Button
                type="primary"
                size="large"
                href="/music/guess-band/banks"
                style={themedStyles.banksLinkButton}
              >
                管理自选题库
              </Button>
            ) : null}
          </Space>
        </div>
        {!isAuthenticated ? (
          <Alert
            style={themedStyles.highlightTip}
            type="warning"
            showIcon
            message="登录后可在“管理自选题库”里创建 10-300 题的专属题库并分享链接。"
          />
        ) : null}

        {bands.length === 0 ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="当前没有可用题目"
            description="请先在后端艺术家数据中补齐字段：name、country、formedYear、genre、memberCount、status。"
          />
        ) : null}

        <div className="guess-band-action-row" style={themedStyles.actionRow}>
          <AutoComplete
            className="guess-band-input"
            value={guessInput}
            onChange={(value) => setGuessInput(value)}
            onSelect={(value) => setGuessInput(value)}
            options={filteredBands.map((band) => ({ value: band.name }))}
            style={{ flex: 1, minWidth: 260 }}
            filterOption={(inputValue, option) =>
              option?.value?.toLowerCase().includes(inputValue.toLowerCase())
            }
            disabled={roundOver || bankSwitching}
          >
            <Input
              className="guess-band-real-input"
              size="large"
              placeholder="输入乐队名，例如：Radiohead / Queen / The Beatles"
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  submitGuess();
                }
                if (
                  event.key === 'Tab' &&
                  filteredBands.length > 0 &&
                  !roundOver
                ) {
                  event.preventDefault();
                  submitGuess(filteredBands[0].name);
                }
              }}
            />
          </AutoComplete>
          <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => submitGuess()} disabled={roundOver || bankSwitching}>
            提交猜测
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={restartRound} disabled={!bands.length || bankSwitching}>
            {roundOver ? '下一题' : '换一题'}
          </Button>
        </div>

        {roundOver ? (
          <Card style={themedStyles.answerCard}>
            <Space>
              <TrophyOutlined style={{ color: '#1F8A70' }} />
              <Text strong>
                {solved ? '猜中了！' : '本轮结束！'} 答案：{targetBand.name} | {targetBand.region} | {targetBand.genre} | {targetBand.yearFormed} |
                {' '}{targetBand.members}人 | {targetBand.status}
              </Text>
            </Space>
          </Card>
        ) : null}

        <div className="guess-band-board" style={themedStyles.board}>
          <div className="guess-band-table-scroll">
          <table style={themedStyles.table}>
            <thead>
              <tr>
                <th style={{ ...themedStyles.th, width: '26%' }}>BAND</th>
                <th style={{ ...themedStyles.th, width: '14%' }}>REGION</th>
                <th style={{ ...themedStyles.th, width: '20%' }}>GENRE</th>
                <th style={{ ...themedStyles.th, width: '12%' }}>YEAR</th>
                <th style={{ ...themedStyles.th, width: '12%' }}>MEM</th>
                <th style={{ ...themedStyles.th, width: '16%' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...themedStyles.tdBase, padding: '20px 10px', color: isDark ? '#9CA3AF' : isBlue ? '#AFC4E1' : '#D2BCC8' }}>
                    还没有猜测，开始输入第一个乐队吧
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => (
                  <tr key={attempt.bandName}>
                    <td style={themedStyles.tdBase}>{attempt.bandName}</td>
                    <td style={{ ...themedStyles.tdBase, ...getCellStyleByTheme(attempt.region.state) }}>{attempt.region.value}</td>
                    <td style={{ ...themedStyles.tdBase, ...getCellStyleByTheme(attempt.genre.state) }}>{attempt.genre.value}</td>
                    <td style={{ ...themedStyles.tdBase, ...getCellStyleByTheme(attempt.year.state) }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {attempt.year.value}
                        {renderTrendArrow(attempt.year.arrow)}
                      </span>
                    </td>
                    <td style={{ ...themedStyles.tdBase, ...getCellStyleByTheme(attempt.members.state) }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {attempt.members.value}
                        {renderTrendArrow(attempt.members.arrow)}
                      </span>
                    </td>
                    <td style={{ ...themedStyles.tdBase, ...getCellStyleByTheme(attempt.status.state) }}>{attempt.status.value}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
          </Card>
        </div>

        <Card className="guess-band-side-card" style={themedStyles.sideCard}>
          <Title level={4} style={themedStyles.sideTitle}>
            Tips
          </Title>
          <div style={{ display: 'grid', gap: 10 }}>
            <Tag color={isDark ? 'default' : 'success'} style={{ width: 'fit-content' }}>快捷键</Tag>
            <Text style={themedStyles.sideSubtitle}>
              按 Tab 键可快速选中并提交当前首个联想乐队。
            </Text>
            <Text style={themedStyles.sideSubtitle}>
              猜测次数上限支持自定义，范围为 1-100 次（默认 10 次）。
            </Text>
            <Text style={themedStyles.sideSubtitle}>
              Enter：提交当前输入
            </Text>
            <Text style={themedStyles.sideSubtitle}>
              Esc：关闭联想下拉
            </Text>
            <Text style={themedStyles.sideSubtitle}>
              左侧可按国家/地区筛选，点击名称可直接填入输入框。
            </Text>
            <Text style={themedStyles.sideSubtitle}>
              中国地区请统一使用“华语”作为地区标识（例如筛选时输入“华语”）。
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GuessBand;
