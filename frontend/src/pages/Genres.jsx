import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { genresApi } from '../api/genres';
import { albumsApi } from '../api/albums';
import { useTheme } from '../context/ThemeContext';

const { Title } = Typography;

const getGenreRefsFromAlbum = (album) => {
  if (Array.isArray(album?.genres) && album.genres.length > 0) {
    return album.genres
      .map((genre) => {
        if (typeof genre === 'number') {
          return { id: genre, name: '' };
        }
        return { id: genre?.id, name: genre?.name || '' };
      })
      .filter((genre) => genre.id != null || genre.name);
  }
  if (Array.isArray(album?.genreIds) && album.genreIds.length > 0) {
    return album.genreIds.map((id) => ({ id, name: '' }));
  }
  if (album?.genreId != null) {
    return [{ id: album.genreId, name: album.genreName || '' }];
  }
  if (album?.genreName) {
    return [{ id: null, name: album.genreName }];
  }
  return [];
};

const buildGenreCoverLookup = (albums) => {
  const byId = new Map();
  const byName = new Map();

  albums.forEach((album) => {
    const coverUrl = album?.coverUrl || null;
    if (!coverUrl) {
      return;
    }

    const refs = getGenreRefsFromAlbum(album);
    refs.forEach((genreRef) => {
      if (genreRef.id != null && !byId.has(genreRef.id)) {
        byId.set(genreRef.id, coverUrl);
      }
      const normalizedName = (genreRef.name || '').trim().toLowerCase();
      if (normalizedName && !byName.has(normalizedName)) {
        byName.set(normalizedName, coverUrl);
      }
    });
  });

  return { byId, byName };
};

const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '42px',
    fontWeight: 700,
    color: '#4E342E',
    marginBottom: '24px',
    letterSpacing: '1px',
  },
  card: {
    textAlign: 'center',
    background: 'linear-gradient(145deg, #FFFBF7 0%, #FFF2E6 100%)',
    borderRadius: '12px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid #E5B992',
    aspectRatio: '1 / 1',
    cursor: 'pointer',
  },
  cardWithCover: {
    position: 'relative',
    overflow: 'hidden',
  },
  cardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(24, 17, 13, 0.35) 0%, rgba(24, 17, 13, 0.65) 100%)',
  },
  cardContent: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '12px',
  },
  name: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
    fontSize: 'clamp(17px, 2.2vw, 22px)',
    fontWeight: 700,
    color: '#4E342E',
    lineHeight: 1.25,
    marginBottom: 0,
  },
  count: {
    fontFamily: "'Cormorant Garamond', serif",
    color: '#6D4C41',
    fontSize: 'clamp(13px, 1.5vw, 16px)',
    fontWeight: 600,
    marginTop: '4px',
  },
};

const Genres = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const themedStyles = useMemo(() => {
    if (!isDark) {
      return styles;
    }
    return {
      ...styles,
      pageTitle: {
        ...styles.pageTitle,
        color: '#E5E7EB',
      },
      card: {
        ...styles.card,
        background: 'linear-gradient(145deg, #171719 0%, #121214 100%)',
        border: '1px solid #2F2F33',
      },
      name: {
        ...styles.name,
        color: '#E5E7EB',
      },
      count: {
        ...styles.count,
        color: '#9CA3AF',
      },
    };
  }, [isDark]);
  const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/api') || url.startsWith('/')) {
      return new URL(url, window.location.origin).toString();
    }
    return url;
  };

  useEffect(() => {
    const loadGenres = async () => {
      setLoading(true);
      try {
        const [genresRes, albumsRes] = await Promise.all([
          genresApi.getAll(),
          albumsApi.getAll(),
        ]);
        const genresData = genresRes.data || [];
        const albums = albumsRes.data || [];
        const { byId, byName } = buildGenreCoverLookup(albums);
        const genresWithCover = genresData.map((genre) => {
          if (!genre?.id || (genre.albumCount ?? 0) <= 0) {
            return genre;
          }
          const byGenreId = byId.get(genre.id) || null;
          const byGenreName = byName.get((genre.name || '').trim().toLowerCase()) || null;
          return {
            ...genre,
            genreCoverUrl: byGenreId || byGenreName || null,
          };
        });
        setGenres(genresWithCover);
      } catch {
        message.error('加载风格失败');
      } finally {
        setLoading(false);
      }
    };
    loadGenres();
  }, []);

  return (
    <div>
      <h1 style={themedStyles.pageTitle}>{isDark ? '浏览风格' : '🎸 浏览风格'}</h1>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : genres.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="暂无风格数据" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {genres.map((genre) => (
            <Col key={genre.id} xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                style={{
                  ...themedStyles.card,
                  ...(genre.genreCoverUrl
                    ? {
                        ...styles.cardWithCover,
                        backgroundImage: `url(${resolveMediaUrl(genre.genreCoverUrl)})`,
                      }
                    : {}),
                }}
                onClick={() => navigate(`/music/genres/${genre.id}`)}
              >
                {genre.genreCoverUrl && <div style={styles.cardOverlay} />}
                <div style={styles.cardContent}>
                  <Title
                    level={4}
                    style={{
                      ...styles.name,
                      ...themedStyles.name,
                      ...(genre.genreCoverUrl
                        ? {
                            color: '#FFF7EE',
                            textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                          }
                        : {}),
                    }}
                  >
                    {genre.name}
                  </Title>
                  <div
                    style={{
                      ...styles.count,
                      ...themedStyles.count,
                      ...(genre.genreCoverUrl
                        ? {
                            color: '#FFEBD9',
                            textShadow: '0 1px 3px rgba(0,0,0,0.55)',
                          }
                        : {}),
                    }}
                  >
                    {genre.albumCount || 0} 张专辑
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Genres;
