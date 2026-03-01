import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';

const { Title } = Typography;

const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '42px',
    fontWeight: 700,
    color: '#1F3D77',
    marginBottom: '24px',
    letterSpacing: '1px',
  },
  card: {
    borderRadius: 12,
    border: '1px solid #E5B992',
    background: 'linear-gradient(145deg, #F1F7FF 0%, #DDEBFF 100%)',
    cursor: 'pointer',
    height: '100%',
  },
  yearName: {
    color: '#5D4037',
    marginBottom: 8,
  },
  coverWrap: {
    width: '100%',
    aspectRatio: '4 / 3',
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
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
    const controller = new AbortController();

    const loadData = async () => {
      setLoading(true);
      try {
        const [yearsRes, albumsRes, artistsRes] = await Promise.all([
          albumsApi.getYears({ signal: controller.signal }),
          albumsApi.getAll({ signal: controller.signal }),
          artistsApi.getAll({ signal: controller.signal }),
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
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }
        message.error('加载年份失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    return () => controller.abort();
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

  const themedStyles = useMemo(() => {
    if (!isDark) {
      return styles;
    }
    return {
      ...styles,
      pageTitle: { ...styles.pageTitle, color: '#E5E7EB' },
      card: {
        ...styles.card,
        border: '1px solid #2F2F33',
        background: 'linear-gradient(145deg, #171719 0%, #131316 100%)',
      },
      yearName: { ...styles.yearName, color: '#E5E7EB' },
      coverWrap: {
        ...styles.coverWrap,
        background: 'linear-gradient(145deg, #1D1D21 0%, #18181B 100%)',
      },
    };
  }, [isDark]);

  return (
    <div>
      <h1 style={themedStyles.pageTitle}>{isDark ? '浏览年份' : '🗓 浏览年份'}</h1>
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
            <Col key={item.year} xs={12} sm={8} md={6} lg={4}>
              <Card
                hoverable
                style={themedStyles.card}
                onClick={() => navigate(`/music/years/${item.year}`)}
              >
                <Title level={4} style={themedStyles.yearName}>{item.year}</Title>
                <div style={themedStyles.coverWrap}>
                  {item.coverUrl ? (
                    <img src={resolveCoverUrl(item.coverUrl)} alt={`${item.year} 年专辑封面`} style={styles.coverImage} />
                  ) : null}
                </div>
                <Tag color={isDark ? 'default' : 'blue'}>{item.albumCount} 张专辑</Tag>
                <Tag color={isDark ? 'default' : 'geekblue'}>{item.formedBandCount} 支当年成立乐队</Tag>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Years;
