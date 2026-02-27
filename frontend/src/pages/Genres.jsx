import { useEffect, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { genresApi } from '../api/genres';
import { albumsApi } from '../api/albums';

const { Title } = Typography;

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
    background: 'linear-gradient(145deg, #FFFCF8 0%, #FFF8F0 100%)',
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
    fontSize: 'clamp(20px, 2.5vw, 26px)',
    fontWeight: 700,
    color: '#4E342E',
    lineHeight: 1.25,
    marginBottom: 0,
    WebkitTextStroke: '0.5px rgba(58, 35, 28, 0.65)',
    textShadow: '0 1px 2px rgba(255, 248, 238, 0.45)',
  },
  count: {
    fontFamily: "'Cormorant Garamond', serif",
    color: '#6D4C41',
    fontSize: 'clamp(15px, 1.8vw, 18px)',
    fontWeight: 600,
    marginTop: '4px',
    WebkitTextStroke: '0.35px rgba(58, 35, 28, 0.5)',
    textShadow: '0 1px 2px rgba(255, 248, 238, 0.45)',
  },
};

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
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
        const response = await genresApi.getAll();
        const genresWithCover = await Promise.all(
          (response.data || []).map(async (genre) => {
            if (!genre?.id || (genre.albumCount ?? 0) <= 0) {
              return genre;
            }
            try {
              const genreAlbumsRes = await albumsApi.getByGenre(genre.id);
              const genreAlbums = genreAlbumsRes.data || [];
              const pickedAlbum = genreAlbums.find((a) => a.coverUrl) || genreAlbums[0];
              return {
                ...genre,
                genreCoverUrl: pickedAlbum?.coverUrl || null,
              };
            } catch {
              return genre;
            }
          })
        );
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
      <h1 style={styles.pageTitle}>🎸 浏览风格</h1>
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
            <Col key={genre.id} xs={12} sm={6} md={4} lg={3}>
              <Card
                hoverable
                style={{
                  ...styles.card,
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
                      ...(genre.genreCoverUrl
                        ? {
                            color: '#FFF7EE',
                            WebkitTextStroke: '0.7px rgba(52, 33, 26, 0.85)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.65)',
                          }
                        : {}),
                    }}
                  >
                    {genre.name}
                  </Title>
                  <div
                    style={{
                      ...styles.count,
                      ...(genre.genreCoverUrl
                        ? {
                            color: '#FFEBD9',
                            WebkitTextStroke: '0.55px rgba(52, 33, 26, 0.8)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.65)',
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
