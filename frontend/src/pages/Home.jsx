import { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Spin, message } from 'antd';
import { albumsApi } from '../api/albums';
import { genresApi } from '../api/genres';
import AlbumCard from '../components/AlbumCard';
import AlphabetFilter from '../components/AlphabetFilter';

const { Title, Text } = Typography;

// 自定义样式
const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '42px',
    fontWeight: 600,
    color: '#5D4037',
    marginBottom: '24px',
    letterSpacing: '1px',
    textShadow: '1px 1px 2px rgba(139, 69, 19, 0.1)',
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '32px',
    fontWeight: 500,
    color: '#6D4C41',
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
    fontWeight: 600,
    color: '#5D4037',
  },
  genreCount: {
    fontFamily: "'Cormorant Garamond', serif",
    color: '#8D6E63',
    fontSize: '14px',
    marginTop: '4px',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8D6E63',
    fontSize: '16px',
    fontFamily: "'Noto Serif SC', serif",
    padding: '40px',
  },
};

const Home = () => {
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedLetter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [albumsRes, genresRes] = await Promise.all([
        selectedLetter 
          ? albumsApi.getByInitial(selectedLetter)
          : albumsApi.getAll(),
        genresApi.getAll(),
      ]);
      setAlbums(albumsRes.data);
      setGenres(genresRes.data);
    } catch (error) {
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
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
