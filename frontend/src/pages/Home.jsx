import { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Spin, message, List, Avatar, Rate, Button, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { reviewsApi } from '../api/reviews';
import AlbumCard from '../components/AlbumCard';
import { resolveAvatarUrl } from '../utils/avatar';
import { useTheme } from '../context/ThemeContext';

const HOME_ALBUM_LIMIT = 12;
const shuffleArray = (arr) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

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
  featureCard: {
    marginBottom: '24px',
    borderRadius: '14px',
    border: '1px solid #D9B99A',
    background: 'linear-gradient(135deg, #FFF7EB 0%, #FFE7CF 100%)',
    boxShadow: '0 6px 18px rgba(139, 69, 19, 0.1)',
  },
  featureTitle: {
    fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
    fontSize: '30px',
    color: '#5D4037',
    lineHeight: 1.2,
  },
  featureDesc: {
    marginTop: '6px',
    color: '#7A5B4E',
    fontSize: '16px',
  },
  sectionTitle: {
    fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
    fontSize: '36px',
    fontWeight: 500,
    color: '#5D4037',
    marginBottom: '20px',
    letterSpacing: '0.5px',
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [albums, setAlbums] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
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

  const themedStyles = useMemo(() => {
    if (!isDark) {
      return styles;
    }
    return {
      ...styles,
      pageTitle: {
        ...styles.pageTitle,
        color: '#E5E7EB',
        textShadow: 'none',
      },
      featureCard: {
        ...styles.featureCard,
        border: '1px solid #2F2F33',
        background: 'linear-gradient(135deg, #171719 0%, #131316 100%)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
      },
      featureTitle: { ...styles.featureTitle, color: '#E5E7EB' },
      featureDesc: { ...styles.featureDesc, color: '#A3A3A3' },
      sectionTitle: { ...styles.sectionTitle, color: '#D1D5DB' },
      emptyText: { ...styles.emptyText, color: '#9CA3AF' },
      reviewCard: {
        ...styles.reviewCard,
        background: 'linear-gradient(145deg, #171719 0%, #131316 100%)',
        border: '1px solid #2F2F33',
      },
      reviewUsername: { ...styles.reviewUsername, color: '#E5E7EB' },
      reviewAlbum: { ...styles.reviewAlbum, color: '#D1D5DB' },
      reviewAlbumCover: { ...styles.reviewAlbumCover, border: '1px solid #2F2F33' },
      reviewContent: {
        ...styles.reviewContent,
        color: '#D1D5DB',
      },
      reviewDate: { ...styles.reviewDate, color: '#9CA3AF' },
    };
  }, [isDark]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [albumsRes, reviewsRes] = await Promise.all([
          albumsApi.getAll(),
          reviewsApi.getRecent(),
        ]);
        const allAlbums = albumsRes.data || [];
        setAlbums(shuffleArray(allAlbums));
        setRecentReviews(reviewsRes.data);
      } catch {
        message.error('加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

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
    }
    if (diffDays === 1) {
      return '昨天';
    }
    if (diffDays < 7) {
      return `${diffDays} 天前`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h1 style={themedStyles.pageTitle}>精选专辑</h1>
      <Card style={themedStyles.featureCard}>
        <Space
          size="middle"
          style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}
        >
          <div>
            <div style={themedStyles.featureTitle}>新功能：Guess-Band 猜乐队</div>
            <div style={themedStyles.featureDesc}>根据地区、风格、年份和人数提示，挑战你对乐队的熟悉度。</div>
          </div>
          <Button type="primary" size="large" onClick={() => navigate('/music/guess-band')}>
            进入 guess-band
          </Button>
        </Space>
      </Card>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {albums.length === 0 ? (
            <Card style={{ borderRadius: '12px' }}>
              <p style={themedStyles.emptyText}>暂无专辑。</p>
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

          {recentReviews.length > 0 && (
            <div style={{ marginTop: '60px' }}>
              <h2 style={themedStyles.sectionTitle}>{isDark ? '最新评论' : '💬 最新评论'}</h2>
              <Card style={themedStyles.reviewCard}>
                <List
                  itemLayout="horizontal"
                  dataSource={recentReviews}
                  renderItem={(review) => (
                    <List.Item style={{ padding: '16px 0' }}>
                      <List.Item.Meta
                        avatar={(
                          <Avatar
                            src={resolveAvatarUrl(review.userAvatar)}
                            size={48}
                            style={{ border: isDark ? '2px solid #2F2F33' : '2px solid #E8D5C4' }}
                          />
                        )}
                        title={(
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <span
                              style={{ ...themedStyles.reviewUsername, cursor: 'pointer' }}
                              onClick={() => navigate(`/users/${review.userId}`)}
                            >
                              {review.username}
                            </span>
                            <Rate
                              disabled
                              value={review.rating}
                              allowHalf
                              style={{ fontSize: '14px', color: isDark ? '#9CA3AF' : '#D4A574' }}
                            />
                            <span style={themedStyles.reviewDate}>{formatDate(review.createdAt)}</span>
                          </div>
                        )}
                        description={(
                          <div>
                            <div style={styles.reviewAlbumRow}>
                              <div
                                style={themedStyles.reviewAlbum}
                                onClick={() => navigate(`/music/albums/${review.albumId}`)}
                                title={`${review.albumTitle} - ${review.artistName}`}
                              >
                                {review.albumTitle} - {review.artistName}
                              </div>
                              {review.albumCoverUrl && (
                                <Avatar
                                  src={resolveMediaUrl(review.albumCoverUrl)}
                                  size={26}
                                  style={themedStyles.reviewAlbumCover}
                                />
                              )}
                            </div>
                            {review.content && <p style={themedStyles.reviewContent}>{review.content}</p>}
                          </div>
                        )}
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
