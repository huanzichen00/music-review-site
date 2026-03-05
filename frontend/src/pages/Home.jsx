import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';
import SmartAlbumCover from '../components/SmartAlbumCover';

const HomeAlbumGrid = lazy(() => import('../components/HomeAlbumGrid'));

const HOME_ALBUM_LIMIT = 6;
const HOME_ALBUM_FETCH_SIZE = 60;
const HOME_ALBUM_PAGE_HINT = 8;

const pickRandomAlbums = (arr, limit) => {
  if (!Array.isArray(arr)) {
    return [];
  }
  if (arr.length <= limit) {
    return arr;
  }
  const copy = [...arr];
  for (let i = 0; i < limit; i += 1) {
    const j = i + Math.floor(Math.random() * (copy.length - i));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, limit);
};

const styles = {
  page: {
    maxWidth: 1160,
    margin: '0 auto',
  },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 220px',
    gap: 18,
    alignItems: 'center',
    borderRadius: 14,
    border: '1px solid #D9B99A',
    background: 'linear-gradient(135deg, #FFF7EB 0%, #FFE7CF 100%)',
    boxShadow: '0 6px 18px rgba(139, 69, 19, 0.10)',
    padding: '18px',
    marginBottom: '20px',
  },
  title: {
    fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
    fontSize: '42px',
    color: '#4E342E',
    margin: 0,
    lineHeight: 1.15,
  },
  subtitle: {
    marginTop: 8,
    color: '#7A5B4E',
    fontSize: 16,
    lineHeight: 1.6,
  },
  ctaRow: {
    display: 'flex',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  ctaBtn: {
    border: 'none',
    borderRadius: 10,
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    color: '#FFF8E7',
  },
  ctaSubBtn: {
    border: '1px solid #D9B99A',
    borderRadius: 10,
    padding: '10px 16px',
    fontWeight: 700,
    cursor: 'pointer',
    background: '#FFF7EB',
    color: '#5D4037',
  },
  heroCoverWrap: {
    width: 220,
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid #D9B99A',
    background: '#F5E6D3',
  },
  heroCover: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  loadingHint: {
    color: '#8D6E63',
    fontSize: 14,
    marginBottom: 12,
  },
  error: {
    borderRadius: 10,
    background: '#FFF1F0',
    border: '1px solid #FFCCC7',
    color: '#CF1322',
    padding: '10px 12px',
    marginBottom: 14,
  },
};

const Home = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const firstAlbum = albums[0] || null;

  useEffect(() => {
    const controller = new AbortController();
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const randomPage = Math.floor(Math.random() * HOME_ALBUM_PAGE_HINT);
        const albumsRes = await albumsApi.getAll({
          signal: controller.signal,
          page: randomPage,
          size: HOME_ALBUM_FETCH_SIZE,
        });
        const albumsData = albumsRes?.data;
        const allAlbums = Array.isArray(albumsData?.content)
          ? albumsData.content
          : (Array.isArray(albumsData) ? albumsData : []);
        setAlbums(pickRandomAlbums(allAlbums, HOME_ALBUM_LIMIT));
      } catch (err) {
        if (isRequestCanceled(err)) {
          return;
        }
        setError('加载首页专辑失败，请稍后重试。');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!firstAlbum?.id || typeof document === 'undefined') {
      return undefined;
    }
    const href = `/covers/${firstAlbum.id}_300.webp`;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = href;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [firstAlbum?.id]);

  const themedStyles = useMemo(() => {
    if (!isDark) {
      return styles;
    }
    return {
      ...styles,
      hero: {
        ...styles.hero,
        border: '1px solid #2F2F33',
        background: 'linear-gradient(135deg, #171719 0%, #131316 100%)',
        boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
      },
      title: {
        ...styles.title,
        color: '#E5E7EB',
      },
      subtitle: {
        ...styles.subtitle,
        color: '#A3A3A3',
      },
      ctaBtn: {
        ...styles.ctaBtn,
        background: 'linear-gradient(135deg, #3F3F46 0%, #27272A 100%)',
        color: '#F3F4F6',
      },
      ctaSubBtn: {
        ...styles.ctaSubBtn,
        border: '1px solid #2F2F33',
        background: '#18181B',
        color: '#D1D5DB',
      },
      heroCoverWrap: {
        ...styles.heroCoverWrap,
        border: '1px solid #2F2F33',
        background: '#18181B',
      },
      loadingHint: {
        ...styles.loadingHint,
        color: '#9CA3AF',
      },
      error: {
        ...styles.error,
        background: '#3F1D1D',
        border: '1px solid #7F1D1D',
        color: '#FCA5A5',
      },
    };
  }, [isDark]);

  return (
    <div style={themedStyles.page}>
      <section style={themedStyles.hero}>
        <div>
          <h1 style={themedStyles.title}>精选专辑</h1>
          <div style={themedStyles.ctaRow}>
            <button type="button" style={themedStyles.ctaBtn} onClick={() => navigate('/music/guess-band')}>
              进入 Guess-Band
            </button>
            <button type="button" style={themedStyles.ctaSubBtn} onClick={() => navigate('/music/albums')}>
              浏览全部专辑
            </button>
          </div>
        </div>

        <div style={themedStyles.heroCoverWrap}>
          {firstAlbum?.id ? (
            <SmartAlbumCover
              albumId={firstAlbum.id}
              coverUrl={firstAlbum.coverUrl}
              alt={firstAlbum.title || 'album cover'}
              variant="thumb"
              width={220}
              height={220}
              style={themedStyles.heroCover}
              loading="eager"
              fetchPriority="high"
            />
          ) : null}
        </div>
      </section>

      {error ? <div style={themedStyles.error}>{error}</div> : null}
      {loading ? <div style={themedStyles.loadingHint}>正在加载推荐专辑...</div> : null}

      <Suspense fallback={<div style={themedStyles.loadingHint}>正在加载专辑列表...</div>}>
        <HomeAlbumGrid albums={albums} />
      </Suspense>
    </div>
  );
};

export default Home;
