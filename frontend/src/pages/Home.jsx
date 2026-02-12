import { useState, useEffect } from 'react';
import { Row, Col, Card, Spin, message, List, Avatar, Rate } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { genresApi } from '../api/genres';
import { reviewsApi } from '../api/reviews';
import AlbumCard from '../components/AlbumCard';

const HOME_ALBUM_LIMIT = 12;

// 自定义样式
const styles = {
  pageTitle: {
    fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
    fontSize: '48px',
    fontWeight: 500,
    color: '#4E342E',
    marginBottom: '24px',
    letterSpacing: '1px',
    textShadow: '1px 1px 2px rgba(139, 69, 19, 0.15)',
  },
  sectionTitle: {
    fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
    fontSize: '36px',
    fontWeight: 500,
    color: '#5D4037',
    marginBottom: '20px',
    letterSpacing: '0.5px',
  },
  genreCard: {
    textAlign: 'center',
    background: 'linear-gradient(145deg, #FFFCF8 0%, #FFF8F0 100%)',
    borderRadius: '12px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    border: '1px solid #E5B992',
    aspectRatio: '1 / 1',
  },
  genreCardWithCover: {
    position: 'relative',
    overflow: 'hidden',
  },
  genreCardOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(24, 17, 13, 0.35) 0%, rgba(24, 17, 13, 0.65) 100%)',
  },
  genreCardContent: {
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
  genreName: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
    fontSize: 'clamp(17px, 2.2vw, 22px)',
    fontWeight: 700,
    color: '#4E342E',
    lineHeight: 1.25,
  },
  genreCount: {
    fontFamily: "'Cormorant Garamond', serif",
    color: '#6D4C41',
    fontSize: 'clamp(13px, 1.5vw, 16px)',
    fontWeight: 600,
    marginTop: '4px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6D4C41',
    fontSize: '16px',
    fontWeight: 500,
    fontFamily: "'Noto Serif SC', serif",
    padding: '40px',
  },
  reviewCard: {
    borderRadius: '12px',
    background: 'linear-gradient(145deg, #FFF8EE 0%, #FFE9D6 100%)',
    border: '1px solid #E5B992',
  },
  reviewUsername: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '18px',
    fontWeight: 700,
    color: '#4E342E',
  },
  reviewAlbum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '16px',
    fontWeight: 600,
    color: '#5D4037',
    cursor: 'pointer',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  reviewAlbumRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  reviewAlbumCover: {
    flexShrink: 0,
    border: '1px solid #E5B992',
  },
  reviewContent: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '18px',
    fontWeight: 500,
    color: '#4E342E',
    marginTop: '12px',
    marginBottom: '8px',
    lineHeight: 1.8,
    maxHeight: '96px',
    overflowY: 'auto',
    overflowX: 'hidden',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    textDecoration: 'underline',
    textDecorationColor: '#D4A574',
    textUnderlineOffset: '4px',
    padding: '12px 8px 12px 0',
  },
  reviewDate: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '14px',
    fontWeight: 600,
    color: '#8D6E63',
  },
};

const Home = () => {
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const resolveAvatarUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/api') || url.startsWith('/')) {
      return new URL(url, window.location.origin).toString();
    }
    return new URL(`/api/files/avatars/${url}`, window.location.origin).toString();
  };
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
  const visibleGenres = genres.filter((genre) => (genre.albumCount ?? 0) > 0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [albumsRes, genresRes, reviewsRes] = await Promise.all([
        albumsApi.getAll(),
        genresApi.getAll(),
        reviewsApi.getRecent(),
      ]);
      const genresWithCover = await Promise.all(
        (genresRes.data || []).map(async (genre) => {
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
      setAlbums(albumsRes.data);
      setGenres(genresWithCover);
      setRecentReviews(reviewsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} 分钟前`;
      }
      return `${diffHours} 小时前`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays} 天前`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h1 style={styles.pageTitle}>精选专辑</h1>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {albums.length === 0 ? (
            <Card style={{ borderRadius: '12px' }}>
              <p style={styles.emptyText}>
                暂无专辑。
              </p>
            </Card>
          ) : (
            <Row gutter={[24, 24]}>
              {albums.slice(0, HOME_ALBUM_LIMIT).map((album) => (
                <Col key={album.id} xs={12} sm={8} md={6} lg={4}>
                  <AlbumCard album={album} />
                </Col>
              ))}
            </Row>
          )}

          {/* Recent Reviews Section */}
          {recentReviews.length > 0 && (
            <div style={{ marginTop: '60px' }}>
              <h2 style={styles.sectionTitle}>💬 最新评论</h2>
              <Card style={styles.reviewCard}>
                <List
                  itemLayout="horizontal"
                  dataSource={recentReviews}
                  renderItem={(review) => (
                    <List.Item style={{ padding: '16px 0' }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            src={resolveAvatarUrl(review.userAvatar)} 
                            icon={!review.userAvatar && <UserOutlined />}
                            size={48}
                            style={{ border: '2px solid #E8D5C4' }}
                          />
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span style={styles.reviewUsername}>{review.username}</span>
                            <Rate 
                              disabled 
                              value={review.rating} 
                              allowHalf 
                              style={{ fontSize: '14px', color: '#D4A574' }} 
                            />
                            <span style={styles.reviewDate}>{formatDate(review.createdAt)}</span>
                          </div>
                        }
                        description={
                          <div>
                            <div style={styles.reviewAlbumRow}>
                              <div 
                                style={styles.reviewAlbum}
                                onClick={() => navigate(`/music/albums/${review.albumId}`)}
                                title={`${review.albumTitle} - ${review.artistName}`}
                              >
                                {review.albumTitle} - {review.artistName}
                              </div>
                              {review.albumCoverUrl && (
                                <Avatar
                                  src={resolveMediaUrl(review.albumCoverUrl)}
                                  size={26}
                                  style={styles.reviewAlbumCover}
                                />
                              )}
                            </div>
                            {review.content && (
                              <p style={styles.reviewContent}>{review.content}</p>
                            )}
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}

          {/* Genres Section */}
          {visibleGenres.length > 0 && (
            <div style={{ marginTop: '60px' }}>
              <h2 style={styles.sectionTitle}>🎸 风格</h2>
              <Row gutter={[20, 20]}>
                {visibleGenres.map((genre) => (
                  <Col key={genre.id} xs={12} sm={8} md={6} lg={4}>
                    <Card 
                      hoverable
                      style={{
                        ...styles.genreCard,
                        ...(genre.genreCoverUrl
                          ? {
                              ...styles.genreCardWithCover,
                              backgroundImage: `url(${resolveMediaUrl(genre.genreCoverUrl)})`,
                            }
                          : {}),
                      }}
                    >
                      {genre.genreCoverUrl && <div style={styles.genreCardOverlay} />}
                      <div style={styles.genreCardContent}>
                        <div
                          style={{
                            ...styles.genreName,
                            ...(genre.genreCoverUrl
                              ? { color: '#FFF7EE', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }
                              : {}),
                          }}
                        >
                          {genre.name}
                        </div>
                        {genre.albumCount > 0 && (
                          <div
                            style={{
                              ...styles.genreCount,
                              ...(genre.genreCoverUrl
                                ? { color: '#FFEBD9', textShadow: '0 1px 3px rgba(0,0,0,0.55)' }
                                : {}),
                            }}
                          >
                            {genre.albumCount} 张专辑
                          </div>
                        )}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
