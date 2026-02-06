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
  },
  genreIcon: {
    fontSize: '36px',
    marginBottom: '12px',
  },
  genreName: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
    fontSize: '18px',
    fontWeight: 700,
    color: '#4E342E',
  },
  genreCount: {
    fontFamily: "'Cormorant Garamond', serif",
    color: '#6D4C41',
    fontSize: '15px',
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
  },
  reviewContent: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '18px',
    fontWeight: 500,
    color: '#4E342E',
    marginTop: '12px',
    marginBottom: '8px',
    lineHeight: 1.8,
    display: '-webkit-box',
    WebkitLineClamp: 4,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    textDecoration: 'underline',
    textDecorationColor: '#D4A574',
    textUnderlineOffset: '4px',
    padding: '12px 0',
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
    return url.startsWith('/api') ? new URL(url, window.location.origin).toString() : url;
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
      setAlbums(albumsRes.data);
      setGenres(genresRes.data);
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
                            <div 
                              style={styles.reviewAlbum}
                              onClick={() => navigate(`/albums/${review.albumId}`)}
                            >
                              {review.albumTitle} - {review.artistName}
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
                      style={styles.genreCard}
                    >
                      <div style={styles.genreIcon}>🎸</div>
                      <div style={styles.genreName}>{genre.name}</div>
                      {genre.albumCount > 0 && (
                        <div style={styles.genreCount}>
                          {genre.albumCount} 张专辑
                        </div>
                      )}
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
