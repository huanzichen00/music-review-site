import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Pagination, Row, Spin, Tag, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { genresApi } from '../api/genres';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';
import AlbumCard from '../components/AlbumCard';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';

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

const splitGenres = (value) =>
  String(value || '')
    .split(/[\/|,&，、;；]+/)
    .map((part) => normalizeGenre(part))
    .filter(Boolean);

const GenreDetail = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { id } = useParams();
  const navigate = useNavigate();
  const [genre, setGenre] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bandPage, setBandPage] = useState(1);
  const [albumPage, setAlbumPage] = useState(1);
  const BAND_PAGE_SIZE = 24;
  const ALBUM_PAGE_SIZE = 24;
  const themedStyles = useMemo(() => {
    if (!isDark) {
      return styles;
    }
    return {
      ...styles,
      title: {
        ...styles.title,
        color: '#E5E7EB',
      },
      sectionTitle: {
        ...styles.sectionTitle,
        color: '#D1D5DB',
      },
      bandCard: {
        ...styles.bandCard,
        border: '1px solid #2F2F33',
        background: 'linear-gradient(145deg, #171719 0%, #121214 100%)',
      },
    };
  }, [isDark]);

  useEffect(() => {
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      try {
        const [genreRes, albumsRes] = await Promise.all([
          genresApi.getById(id, { signal: controller.signal }),
          albumsApi.getByGenre(id, { signal: controller.signal }),
        ]);
        setGenre(genreRes.data || null);
        setAlbums(albumsRes.data || []);

        const artistsRes = await artistsApi.getAll({ signal: controller.signal });
        const allArtists = artistsRes.data || [];
        const genreName = normalizeGenre(genreRes.data?.name || '');
        const sameGenreArtists = allArtists.filter(
          (artist) => {
            const artistGenreRaw = artist?.genre || '';
            if (!artistGenreRaw || !genreName) return false;
            const parts = splitGenres(artistGenreRaw);
            if (parts.length === 0) return false;
            return parts.includes(genreName);
          }
        );
        setArtists(sameGenreArtists);
        setBandPage(1);
        setAlbumPage(1);
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }
        message.error('加载风格详情失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    return () => controller.abort();
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
      <h1 style={themedStyles.title}>{isDark ? genre.name : `🎼 ${genre.name}`}</h1>
      <Paragraph style={{ color: isDark ? '#9CA3AF' : '#5D4037' }}>{genre.description || '暂无风格描述'}</Paragraph>
      <Tag color={isDark ? 'default' : 'gold'}>{albums.length} 张专辑</Tag>
      <Tag color={isDark ? 'default' : 'processing'}>{bands.length} 支乐队</Tag>

      <Title level={3} style={themedStyles.sectionTitle}>对应乐队</Title>
      {bands.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="该风格下暂无乐队数据" />
        </Card>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {bands
              .slice((bandPage - 1) * BAND_PAGE_SIZE, bandPage * BAND_PAGE_SIZE)
              .map((band) => (
                <Col key={`${band.artistId}-${band.artistName}`} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    hoverable={Boolean(band.artistId)}
                    onClick={() => {
                      if (band.artistId) {
                        navigate(`/music/artists/${band.artistId}`);
                      }
                    }}
                    style={{
                      ...themedStyles.bandCard,
                      cursor: band.artistId ? 'pointer' : 'default',
                    }}
                  >
                    <Title level={5} style={{ marginBottom: 6, color: isDark ? '#E5E7EB' : '#4E342E' }}>{band.artistName}</Title>
                    <Text style={{ color: isDark ? '#9CA3AF' : '#8D6E63' }}>{band.albumCount} 张专辑</Text>
                  </Card>
                </Col>
              ))}
          </Row>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={bandPage}
              pageSize={BAND_PAGE_SIZE}
              total={bands.length}
              showSizeChanger={false}
              onChange={setBandPage}
            />
          </div>
        </>
      )}

      <Title level={3} style={themedStyles.sectionTitle}>对应专辑</Title>
      {albums.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="该风格下暂无专辑" />
        </Card>
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {albums
              .slice((albumPage - 1) * ALBUM_PAGE_SIZE, albumPage * ALBUM_PAGE_SIZE)
              .map((album) => (
                <Col key={album.id} xs={12} sm={8} md={6} lg={4}>
                  <AlbumCard album={album} />
                </Col>
              ))}
          </Row>
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
            <Pagination
              current={albumPage}
              pageSize={ALBUM_PAGE_SIZE}
              total={albums.length}
              showSizeChanger={false}
              onChange={setAlbumPage}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default GenreDetail;
