import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Row, Spin, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { genresApi } from '../api/genres';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';
import { unwrapListData } from '../utils/apiData';

const { Text } = Typography;

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
    position: 'relative',
    borderRadius: '8px',
    border: '1px solid #B08B67',
    background: 'linear-gradient(180deg, #2B2016 0%, #21180F 100%)',
    minHeight: 122,
    cursor: 'pointer',
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    background: 'linear-gradient(180deg, #E0A15E 0%, #AF6B32 100%)',
  },
  cardInner: {
    padding: '16px 16px 14px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  name: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
    fontSize: '24px',
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: '0.6px',
    color: '#F3E0C8',
    textTransform: 'uppercase',
    marginBottom: 0,
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  count: {
    fontFamily: "'Courier New', 'Noto Sans SC', monospace",
    color: '#D6B089',
    fontSize: '13px',
    letterSpacing: '0.8px',
  },
  action: {
    fontFamily: "'Courier New', 'Noto Sans SC', monospace",
    color: '#F1C387',
    fontSize: '12px',
    letterSpacing: '1px',
  },
};

const Genres = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const themedStyles = useMemo(() => {
    if (!isDark) {
      return styles;
    }
    return {
      ...styles,
      pageTitle: {
        ...styles.pageTitle,
        color: '#E5E7EB',
      },
      card: {
        ...styles.card,
        border: '1px solid #3A3A40',
        background: 'linear-gradient(180deg, #171719 0%, #121214 100%)',
      },
      cardAccent: {
        ...styles.cardAccent,
        background: 'linear-gradient(180deg, #7C8088 0%, #545A63 100%)',
      },
      name: {
        ...styles.name,
        color: '#E5E7EB',
      },
      count: {
        ...styles.count,
        color: '#A3A3A3',
      },
      action: {
        ...styles.action,
        color: '#B2B6BE',
      },
    };
  }, [isDark]);

  useEffect(() => {
    const controller = new AbortController();

    const loadGenres = async () => {
      setLoading(true);
      try {
        const response = await genresApi.getAll({ signal: controller.signal });
        setGenres(
          unwrapListData(response.data).sort((a, b) =>
            (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' })
          )
        );
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }
        message.error('加载风格失败');
      } finally {
        setLoading(false);
      }
    };
    loadGenres();
    return () => controller.abort();
  }, []);

  return (
    <div>
      <h1 style={themedStyles.pageTitle}>{isDark ? '浏览风格' : '🎸 浏览风格'}</h1>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spin size="large" />
        </div>
      ) : genres.length === 0 ? (
        <Card style={{ borderRadius: 12 }}>
          <Empty description="暂无风格数据" />
        </Card>
      ) : (
        <Row gutter={[14, 14]}>
          {genres.map((genre) => (
            <Col key={genre.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                style={themedStyles.card}
                styles={{ body: { padding: 0 } }}
                onClick={() => navigate(`/music/genres/${genre.id}`)}
              >
                <div style={themedStyles.cardAccent} />
                <div style={styles.cardInner}>
                  <Text style={themedStyles.name}>{genre.name}</Text>
                  <div style={styles.metaRow}>
                    <Text style={themedStyles.count}>{(genre.albumCount || 0).toString().padStart(3, '0')} ALBUMS</Text>
                    <Text style={themedStyles.action}>OPEN &gt;</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default Genres;
