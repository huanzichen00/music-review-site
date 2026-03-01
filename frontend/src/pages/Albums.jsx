import { useState, useEffect } from 'react';
import { Row, Col, Card, Pagination, Spin, message } from 'antd';
import { albumsApi } from '../api/albums';
import AlbumCard from '../components/AlbumCard';
import AlphabetFilter from '../components/AlphabetFilter';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';

const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '42px',
    fontWeight: 700,
    color: '#4E342E',
    marginBottom: '24px',
    letterSpacing: '1px',
    textShadow: '1px 1px 2px rgba(139, 69, 19, 0.15)',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6D4C41',
    fontSize: '16px',
    fontWeight: 500,
    fontFamily: "'Noto Serif SC', serif",
    padding: '40px',
  },
};

const getInitialGroup = (title) => {
  const firstChar = String(title || '').trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstChar) ? firstChar : '#';
};

const compareAlbumsByInitial = (a, b) => {
  const aGroup = getInitialGroup(a?.title);
  const bGroup = getInitialGroup(b?.title);
  const aOrder = aGroup === '#' ? 26 : aGroup.charCodeAt(0) - 65;
  const bOrder = bGroup === '#' ? 26 : bGroup.charCodeAt(0) - 65;
  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }
  return String(a?.title || '').localeCompare(String(b?.title || ''), 'en', { sensitivity: 'base' });
};

const Albums = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24;

  useEffect(() => {
    const controller = new AbortController();

    const loadAlbums = async () => {
      setLoading(true);
      try {
        const albumsRes = selectedLetter
          ? await albumsApi.getByInitial(selectedLetter, { signal: controller.signal })
          : await albumsApi.getAll({ signal: controller.signal });
        setAlbums((albumsRes.data || []).slice().sort(compareAlbumsByInitial));
        setCurrentPage(1);
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }
        message.error('加载专辑失败');
      } finally {
        setLoading(false);
      }
    };
    loadAlbums();
    return () => controller.abort();
  }, [selectedLetter]);

  return (
    <div>
      <h1 style={styles.pageTitle}>{isDark ? '浏览专辑' : '🎵 浏览专辑'}</h1>

      <AlphabetFilter
        selected={selectedLetter}
        onChange={setSelectedLetter}
      />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          {albums.length === 0 ? (
            <Card style={{ borderRadius: '12px' }}>
              <p style={styles.emptyText}>
                暂无专辑。{selectedLetter && '请尝试选择其他字母。'}
              </p>
            </Card>
          ) : (
            <>
              <Row gutter={[24, 24]}>
                {albums
                  .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
                  .map((album) => (
                    <Col key={album.id} xs={12} sm={8} md={6} lg={4}>
                      <AlbumCard album={album} />
                    </Col>
                  ))}
              </Row>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <Pagination
                  current={currentPage}
                  pageSize={PAGE_SIZE}
                  total={albums.length}
                  showSizeChanger={false}
                  onChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Albums;
