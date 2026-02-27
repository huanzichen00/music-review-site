import { useEffect, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Tag, Typography, message } from 'antd';
import { useParams } from 'react-router-dom';
import { artistsApi } from '../api/artists';
import { albumsApi } from '../api/albums';
import AlbumCard from '../components/AlbumCard';

const { Title, Paragraph, Text } = Typography;

const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '40px',
    fontWeight: 700,
    color: '#4E342E',
    marginBottom: 10,
  },
  metaRow: {
    marginBottom: 14,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 16,
    color: '#5D4037',
  },
  artistCard: {
    borderRadius: 12,
    border: '1px solid #E5B992',
    background: 'linear-gradient(145deg, #FFF8EE 0%, #FFE9D6 100%)',
  },
};

const ArtistDetail = () => {
  const { id } = useParams();
  const [artist, setArtist] = useState(null);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [artistRes, albumsRes] = await Promise.all([
          artistsApi.getById(id),
          albumsApi.getByArtist(id),
        ]);
        setArtist(artistRes.data || null);
        setAlbums(albumsRes.data || []);
      } catch {
        message.error('加载乐队详情失败');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!artist) {
    return (
      <Card style={{ borderRadius: 12 }}>
        <Empty description="未找到该乐队" />
      </Card>
    );
  }

  return (
    <div>
      <Card style={styles.artistCard}>
        <h1 style={styles.pageTitle}>{artist.name}</h1>
        <div style={styles.metaRow}>
          {artist.country ? <Tag color="processing">地区：{artist.country}</Tag> : null}
          {artist.formedYear ? <Tag color="gold">成立：{artist.formedYear}</Tag> : null}
          {artist.genre ? <Tag color="purple">风格：{artist.genre}</Tag> : null}
          {artist.memberCount ? <Tag color="cyan">成员：{artist.memberCount} 人</Tag> : null}
          {artist.status ? <Tag color={artist.status === '活跃' ? 'success' : 'default'}>{artist.status}</Tag> : null}
          <Tag color="blue">专辑：{albums.length} 张</Tag>
        </div>
        {artist.description ? (
          <Paragraph>{artist.description}</Paragraph>
        ) : (
          <Text type="secondary">暂无乐队简介</Text>
        )}
      </Card>

      <Title level={3} style={styles.sectionTitle}>专辑</Title>
      {albums.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="该乐队暂无专辑" />
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

export default ArtistDetail;
