import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { useParams } from 'react-router-dom';
import { genresApi } from '../api/genres';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';
import AlbumCard from '../components/AlbumCard';

const { Title, Text, Paragraph } = Typography;

const styles = {
  title: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '40px',
    fontWeight: 700,
    color: '#4E342E',
    marginBottom: '8px',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 16,
    color: '#5D4037',
  },
  bandCard: {
    borderRadius: 12,
    border: '1px solid #E5B992',
    background: 'linear-gradient(145deg, #FFF8EE 0%, #FFE9D6 100%)',
  },
};

const normalizeGenre = (value) =>
  (value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, ' ')
    .trim();

const GenreDetail = () => {
  const { id } = useParams();
  const [genre, setGenre] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [genreRes, albumsRes] = await Promise.all([
          genresApi.getById(id),
          albumsApi.getByGenre(id),
        ]);
        setGenre(genreRes.data || null);
        setAlbums(albumsRes.data || []);

        const artistsRes = await artistsApi.getAll();
        const allArtists = artistsRes.data || [];
        const genreName = normalizeGenre(genreRes.data?.name || '');
        const sameGenreArtists = allArtists.filter(
          (artist) => {
            const artistGenre = normalizeGenre(artist?.genre || '');
            if (!artistGenre || !genreName) return false;
            return (
              artistGenre === genreName ||
              artistGenre.includes(genreName) ||
              genreName.includes(artistGenre)
            );
          }
        );
        setArtists(sameGenreArtists);
      } catch {
        message.error('加载风格详情失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const bands = useMemo(() => {
    const albumCountByArtist = new Map();
    albums.forEach((album) => {
      const key = album.artistId || album.artistName;
      if (!key) return;
      albumCountByArtist.set(key, (albumCountByArtist.get(key) || 0) + 1);
    });

    const bandMap = new Map();
    artists.forEach((artist) => {
      const key = artist.id || artist.name;
      bandMap.set(key, {
        artistId: artist.id || null,
        artistName: artist.name || '未知乐队',
        albumCount: albumCountByArtist.get(key) || 0,
      });
    });

    albums.forEach((album) => {
      const key = album.artistId || album.artistName;
      if (!key || bandMap.has(key)) return;
      bandMap.set(key, {
        artistId: album.artistId || null,
        artistName: album.artistName || '未知乐队',
        albumCount: albumCountByArtist.get(key) || 0,
      });
    });

    return Array.from(bandMap.values()).sort((a, b) => b.albumCount - a.albumCount);
  }, [albums, artists]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!genre) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Empty description="未找到该风格" />
      </Card>
    );
  }

  return (
    <div>
      <h1 style={styles.title}>🎼 {genre.name}</h1>
      <Paragraph>{genre.description || '暂无风格描述'}</Paragraph>
      <Tag color="gold">{albums.length} 张专辑</Tag>
      <Tag color="processing">{bands.length} 支乐队</Tag>

      <Title level={3} style={styles.sectionTitle}>对应乐队</Title>
      {bands.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="该风格下暂无乐队数据" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {bands.map((band) => (
            <Col key={`${band.artistId}-${band.artistName}`} xs={24} sm={12} md={8} lg={6}>
              <Card style={styles.bandCard}>
                <Title level={5} style={{ marginBottom: 6 }}>{band.artistName}</Title>
                <Text type="secondary">{band.albumCount} 张专辑</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Title level={3} style={styles.sectionTitle}>对应专辑</Title>
      {albums.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="该风格下暂无专辑" />
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
    </div>
  );
};

export default GenreDetail;
