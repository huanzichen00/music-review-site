import { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Spin, message } from 'antd';
import { albumsApi } from '../api/albums';
import { genresApi } from '../api/genres';
import AlbumCard from '../components/AlbumCard';
import AlphabetFilter from '../components/AlphabetFilter';

const { Title } = Typography;

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
      <Title level={2}>Browse Albums</Title>
      
      <AlphabetFilter 
        selected={selectedLetter} 
        onChange={setSelectedLetter} 
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {albums.length === 0 ? (
            <Card>
              <p style={{ textAlign: 'center', color: '#999' }}>
                No albums found. {selectedLetter && `Try selecting a different letter.`}
              </p>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {albums.map((album) => (
                <Col key={album.id} xs={12} sm={8} md={6} lg={4}>
                  <AlbumCard album={album} />
                </Col>
              ))}
            </Row>
          )}

          {genres.length > 0 && (
            <div style={{ marginTop: '48px' }}>
              <Title level={3}>Genres</Title>
              <Row gutter={[16, 16]}>
                {genres.map((genre) => (
                  <Col key={genre.id} xs={12} sm={8} md={6} lg={4}>
                    <Card 
                      hoverable
                      style={{ textAlign: 'center' }}
                    >
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎸</div>
                      <div style={{ fontWeight: 'bold' }}>{genre.name}</div>
                      {genre.albumCount > 0 && (
                        <div style={{ color: '#999', fontSize: '12px' }}>
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
