import { useEffect, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { genresApi } from '../api/genres';

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
  name: {
    color: '#5D4037',
    marginBottom: 8,
  },
  count: {
    color: '#8D6E63',
    fontWeight: 600,
  },
};

const Genres = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadGenres = async () => {
      setLoading(true);
      try {
        const response = await genresApi.getAll();
        setGenres(response.data || []);
      } catch {
        message.error('加载风格失败');
      } finally {
        setLoading(false);
      }
    };
    loadGenres();
  }, []);

  return (
    <div>
      <h1 style={styles.pageTitle}>🎸 浏览风格</h1>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : genres.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="暂无风格数据" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          {genres.map((genre) => (
            <Col key={genre.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={styles.card}
                onClick={() => navigate(`/music/genres/${genre.id}`)}
              >
                <Title level={4} style={styles.name}>{genre.name}</Title>
                <Paragraph ellipsis={{ rows: 2 }}>
                  {genre.description || '暂无风格描述'}
                </Paragraph>
                <Text style={styles.count}>{genre.albumCount || 0} 张专辑</Text>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Genres;
