import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';

const { Title, Text, Paragraph } = Typography;

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
  meta: {
    color: '#8D6E63',
    fontWeight: 600,
  },
};

const getYearHint = (year) => {
  if (year < 1960) return '约属战后流行音乐早期阶段';
  if (year < 1970) return '约属摇滚黄金年代开端';
  if (year < 1980) return '约属经典摇滚与前卫摇滚活跃期';
  if (year < 1990) return '约属新浪潮与重型音乐扩张期';
  if (year < 2000) return '约属另类与独立音乐上升期';
  if (year < 2010) return '约属数字音乐转型早期';
  if (year < 2020) return '约属流媒体主导阶段';
  return '约属当代流媒体深度发展阶段';
};

const Years = () => {
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState([]);
  const [albumCountByYear, setAlbumCountByYear] = useState(new Map());
  const [formedBandCountByYear, setFormedBandCountByYear] = useState(new Map());
  const navigate = useNavigate();

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
        allAlbums.forEach((album) => {
          if (!album?.releaseYear) return;
          albumCountMap.set(album.releaseYear, (albumCountMap.get(album.releaseYear) || 0) + 1);
        });
        setAlbumCountByYear(albumCountMap);

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
        hint: getYearHint(year),
      })),
    [years, albumCountByYear, formedBandCountByYear]
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
                <Paragraph>{item.hint}</Paragraph>
                <Tag color="gold">{item.albumCount} 张专辑</Tag>
                <Tag color="processing">{item.formedBandCount} 支当年成立乐队</Tag>
                <div style={{ marginTop: 10 }}>
                  <Text style={styles.meta}>点击查看该年份专辑与成立乐队</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Years;
