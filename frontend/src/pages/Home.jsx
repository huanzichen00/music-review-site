import { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Spin, message, List, Avatar, Rate } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { genresApi } from '../api/genres';
import { reviewsApi } from '../api/reviews';
import AlbumCard from '../components/AlbumCard';
import AlphabetFilter from '../components/AlphabetFilter';

const { Title, Text } = Typography;

// 自定义样式
const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '42px',
    fontWeight: 700,
    color: '#4E342E',
    marginBottom: '24px',
    letterSpacing: '1px',
    textShadow: '1px 1px 2px rgba(139, 69, 19, 0.15)',
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '32px',
    fontWeight: 700,
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
    background: 'linear-gradient(145deg, #F5E6D3 0%, #EDE0D4 100%)',
    border: '1px solid #D4A574',
  },
  reviewUsername: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '20px',
    fontWeight: 700,
    color: '#4E342E',
  },
  reviewAlbum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '18px',
    fontWeight: 600,
    color: '#5D4037',
    cursor: 'pointer',
  },
  reviewContent: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '17px',
    fontWeight: 500,
    color: '#4E342E',
    marginTop: '10px',
    lineHeight: 1.6,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  reviewDate: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '16px',
    fontWeight: 600,
    color: '#6D4C41',
  },
};

const Home = () => {
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [selectedLetter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [albumsRes, genresRes, reviewsRes] = await Promise.all([
        selectedLetter 
          ? albumsApi.getByInitial(selectedLetter)
          : albumsApi.getAll(),
        genresApi.getAll(),
        reviewsApi.getRecent(),
      ]);
      setAlbums(albumsRes.data);
      setGenres(genresRes.data);
      setRecentReviews(reviewsRes.data);
    } catch (error) {
      message.error('Failed to load data');
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
        return `${diffMinutes} minutes ago`;
      }
      return `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    }
    return date.toLocaleDateString();
  };

  return (
    <div>
      <h1 style={styles.pageTitle}>🎵 Browse Albums</h1>
      
      <AlphabetFilter 
        selected={selectedLetter} 
        onChange={setSelectedLetter} 
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {albums.length === 0 ? (
            <Card style={{ borderRadius: '12px' }}>
              <p style={styles.emptyText}>
                No albums found. {selectedLetter && `Try selecting a different letter.`}
              </p>
            </Card>
          ) : (
            <Row gutter={[24, 24]}>
              {albums.map((album) => (
                <Col key={album.id} xs={12} sm={8} md={6} lg={4}>
                  <AlbumCard album={album} />
                </Col>
              ))}
            </Row>
          )}

          {/* Recent Reviews Section */}
          {recentReviews.length > 0 && (
            <div style={{ marginTop: '60px' }}>
              <h2 style={styles.sectionTitle}>💬 Recent Reviews</h2>
              <Card style={styles.reviewCard}>
                <List
                  itemLayout="horizontal"
                  dataSource={recentReviews}
                  renderItem={(review) => (
                    <List.Item style={{ padding: '16px 0' }}>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            src={review.userAvatar} 
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
                              🎵 {review.albumTitle} - {review.artistName}
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
          {genres.length > 0 && (
            <div style={{ marginTop: '60px' }}>
              <h2 style={styles.sectionTitle}>🎸 Genres</h2>
              <Row gutter={[20, 20]}>
                {genres.map((genre) => (
                  <Col key={genre.id} xs={12} sm={8} md={6} lg={4}>
                    <Card 
                      hoverable
                      style={styles.genreCard}
                    >
                      <div style={styles.genreIcon}>🎸</div>
                      <div style={styles.genreName}>{genre.name}</div>
                      {genre.albumCount > 0 && (
                        <div style={styles.genreCount}>
                          {genre.albumCount} albums
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
