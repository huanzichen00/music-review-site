import { useState, useEffect } from 'react';
import { Row, Col, Card, Spin, message } from 'antd';
import { albumsApi } from '../api/albums';
import AlbumCard from '../components/AlbumCard';
import AlphabetFilter from '../components/AlphabetFilter';

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
  emptyText: {
    textAlign: 'center',
    color: '#6D4C41',
    fontSize: '16px',
    fontWeight: 500,
    fontFamily: "'Noto Serif SC', serif",
    padding: '40px',
  },
};

const Albums = () => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);

  useEffect(() => {
    loadAlbums();
  }, [selectedLetter]);

  const loadAlbums = async () => {
    setLoading(true);
    try {
      const albumsRes = selectedLetter
        ? await albumsApi.getByInitial(selectedLetter)
        : await albumsApi.getAll();
      setAlbums(albumsRes.data);
    } catch (error) {
      message.error('加载专辑失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={styles.pageTitle}>🎵 浏览专辑</h1>

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
                暂无专辑。{selectedLetter && '请尝试选择其他字母。'}
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
        </>
      )}
    </div>
  );
};

export default Albums;
