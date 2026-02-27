import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';

const { Title } = Typography;

const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '42px',
    fontWeight: 700,
    color: '#4E342E',
    marginBottom: '24px',
    letterSpacing: '1px',
  },
  card: {
    borderRadius: 12,
    border: '1px solid #E5B992',
    background: 'linear-gradient(145deg, #FFF8EE 0%, #FFE9D6 100%)',
    cursor: 'pointer',
    height: '100%',
  },
  yearName: {
    color: '#5D4037',
    marginBottom: 8,
  },
  coverWrap: {
    width: '100%',
    aspectRatio: '1 / 1',
    borderRadius: 10,
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #F5E6D3 0%, #E8D5C4 100%)',
    marginBottom: 10,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
};

const Years = () => {
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [albumCountByYear, setAlbumCountByYear] = useState(new Map());
  const [formedBandCountByYear, setFormedBandCountByYear] = useState(new Map());
  const [yearCoverByYear, setYearCoverByYear] = useState(new Map());
  const navigate = useNavigate();
  const resolveCoverUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? new URL(url, window.location.origin).toString() : url;
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [yearsRes, albumsRes, artistsRes] = await Promise.all([
          albumsApi.getYears(),
          albumsApi.getAll(),
          artistsApi.getAll(),
        ]);

        const sortedYears = (yearsRes.data || []).slice().sort((a, b) => b - a);
        setYears(sortedYears);

        const allAlbums = albumsRes.data || [];
        const albumCountMap = new Map();
        const coverMap = new Map();
        allAlbums.forEach((album) => {
          if (!album?.releaseYear) return;
          albumCountMap.set(album.releaseYear, (albumCountMap.get(album.releaseYear) || 0) + 1);
          if (!coverMap.has(album.releaseYear) && album.coverUrl) {
            coverMap.set(album.releaseYear, album.coverUrl);
          }
        });
        setAlbumCountByYear(albumCountMap);
        setYearCoverByYear(coverMap);

        const allArtists = artistsRes.data || [];
        const formedCountMap = new Map();
        allArtists.forEach((artist) => {
          if (!artist?.formedYear) return;
          formedCountMap.set(artist.formedYear, (formedCountMap.get(artist.formedYear) || 0) + 1);
        });
        setFormedBandCountByYear(formedCountMap);
      } catch {
        message.error('加载年份失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const yearCards = useMemo(
    () =>
      years.map((year) => ({
        year,
        albumCount: albumCountByYear.get(year) || 0,
        formedBandCount: formedBandCountByYear.get(year) || 0,
        coverUrl: yearCoverByYear.get(year) || '',
      })),
    [years, albumCountByYear, formedBandCountByYear, yearCoverByYear]
  );

  return (
    <div>
      <h1 style={styles.pageTitle}>🗓 浏览年份</h1>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : yearCards.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="暂无年份数据" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {yearCards.map((item) => (
            <Col key={item.year} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={styles.card}
                onClick={() => navigate(`/music/years/${item.year}`)}
              >
                <Title level={4} style={styles.yearName}>{item.year}</Title>
                <div style={styles.coverWrap}>
                  {item.coverUrl ? (
                    <img src={resolveCoverUrl(item.coverUrl)} alt={`${item.year} 年专辑封面`} style={styles.coverImage} />
                  ) : null}
                </div>
                <Tag color="gold">{item.albumCount} 张专辑</Tag>
                <Tag color="processing">{item.formedBandCount} 支当年成立乐队</Tag>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Years;
