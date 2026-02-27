import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
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

const YearDetail = () => {
  const { year } = useParams();
  const navigate = useNavigate();
  const parsedYear = Number.parseInt(year, 10);
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState([]);
  const [formedBands, setFormedBands] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
        message.error('年份参数无效');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [albumsRes, artistsRes] = await Promise.all([
          albumsApi.getByYear(parsedYear),
          artistsApi.getAll(),
        ]);

        const yearAlbums = albumsRes.data || [];
        const allArtists = artistsRes.data || [];
        const artistsFoundedThisYear = allArtists
          .filter((artist) => artist?.formedYear === parsedYear)
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        setAlbums(yearAlbums);
        setFormedBands(artistsFoundedThisYear);
      } catch {
        message.error('加载年份页面失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [parsedYear]);

  const summary = useMemo(
    () => ({ albumCount: albums.length, bandCount: formedBands.length }),
    [albums.length, formedBands.length]
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!Number.isInteger(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Empty description="年份无效" />
      </Card>
    );
  }

  return (
    <div>
      <h1 style={styles.title}>📅 {parsedYear} 年</h1>
      <Paragraph>
        本页展示 {parsedYear} 年发行的专辑，以及明确在 {parsedYear} 年成立的乐队。
      </Paragraph>
      <Tag color="gold">{summary.albumCount} 张专辑</Tag>
      <Tag color="processing">{summary.bandCount} 支当年成立乐队</Tag>

      <Title level={3} style={styles.sectionTitle}>{parsedYear} 年发行专辑</Title>
      {albums.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description={`${parsedYear} 年暂无专辑数据`} />
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

      <Title level={3} style={styles.sectionTitle}>{parsedYear} 年成立的乐队</Title>
      {formedBands.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description={`${parsedYear} 年暂无成立乐队数据`} />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {formedBands.map((band) => (
            <Col key={band.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                onClick={() => navigate(`/music/artists/${band.id}`)}
                style={{ ...styles.bandCard, cursor: 'pointer' }}
              >
                <Title level={5} style={{ marginBottom: 6 }}>{band.name}</Title>
                <Text type="secondary">这支乐队成立于 {parsedYear} 年</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default YearDetail;
