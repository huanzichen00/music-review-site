import { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Spin, message, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import { favoritesApi } from '../api/favorites';
import { useAuth } from '../context/AuthContext';
import AlbumCard from '../components/AlbumCard';

const { Title } = Typography;

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFavorites();
  }, [isAuthenticated]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await favoritesApi.getMyFavorites();
      setFavorites(response.data);
    } catch (error) {
      message.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>My Favorites</Title>

      {favorites.length === 0 ? (
        <Card>
          <Empty description="No favorites yet. Start browsing albums!" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {favorites.map((fav) => (
            <Col key={fav.id} xs={12} sm={8} md={6} lg={4}>
              <AlbumCard 
                album={{
                  id: fav.albumId,
                  title: fav.albumTitle,
                  coverUrl: fav.albumCoverUrl,
                  artistName: fav.artistName,
                  releaseYear: fav.releaseYear,
                }} 
              />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Favorites;
