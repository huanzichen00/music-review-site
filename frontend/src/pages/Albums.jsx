import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Pagination, Spin, message, Input, Button, Space, Tag } from 'antd';
import { albumsApi } from '../api/albums';
import AlbumCard from '../components/AlbumCard';
import AlphabetFilter from '../components/AlphabetFilter';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';
import { unwrapListData } from '../utils/apiData';

const { Search } = Input;

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
  hotSearchLabel: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '14px',
    color: '#6D4C41',
    marginRight: '4px',
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
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [hotSearches, setHotSearches] = useState([]);
  const PAGE_SIZE = 12;

  const loadHotSearches = useCallback(async (signal) => {
    try {
      const response = await albumsApi.getHotSearches(10, { signal });
      setHotSearches(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      if (isRequestCanceled(error)) {
        return;
      }
      // 后端未开放接口时静默跳过，不影响专辑页主流程
      setHotSearches([]);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadAlbums = async () => {
      setLoading(true);
      try {
        const keyword = appliedKeyword.trim();
        const albumsRes = keyword
          ? await albumsApi.search(keyword, { signal: controller.signal, params: { page: 0, size: 500 } })
          : selectedLetter
            ? await albumsApi.getByInitial(selectedLetter, { signal: controller.signal, params: { page: 0, size: 500 } })
            : await albumsApi.getAll({ signal: controller.signal, page: 0, size: 500 });
        setAlbums(unwrapListData(albumsRes.data).slice().sort(compareAlbumsByInitial));
        if (keyword) {
          await loadHotSearches(controller.signal);
        }
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
  }, [appliedKeyword, loadHotSearches, selectedLetter]);

  useEffect(() => {
    const controller = new AbortController();
    loadHotSearches(controller.signal);
    return () => controller.abort();
  }, [loadHotSearches]);

  const applySearch = (rawValue) => {
    const keyword = String(rawValue || '').trim();
    setSearchKeyword(keyword);
    setAppliedKeyword(keyword);
    if (keyword) {
      setSelectedLetter(null);
    }
  };

  const clearSearch = () => {
    setSearchKeyword('');
    setAppliedKeyword('');
  };

  return (
    <div>
      <h1 style={styles.pageTitle}>{isDark ? '浏览专辑' : '🎵 浏览专辑'}</h1>

      <div style={{ marginBottom: 20 }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space.Compact style={{ width: '100%' }}>
            <Search
              placeholder="搜索专辑名"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={applySearch}
              allowClear
              enterButton="搜索"
            />
            {appliedKeyword ? (
              <Button onClick={clearSearch}>清空</Button>
            ) : null}
          </Space.Compact>

          {hotSearches.length > 0 ? (
            <div>
              <span style={{ ...styles.hotSearchLabel, color: isDark ? '#D1D5DB' : styles.hotSearchLabel.color }}>
                热门搜索：
              </span>
              {hotSearches.map((item) => (
                <Tag
                  key={item.keyword}
                  color={appliedKeyword === item.keyword ? 'gold' : 'default'}
                  style={{ cursor: 'pointer', marginBottom: 8 }}
                  onClick={() => applySearch(item.keyword)}
                >
                  {item.keyword}
                </Tag>
              ))}
            </div>
          ) : null}
        </Space>
      </div>

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
                暂无专辑。{appliedKeyword ? '请尝试其他关键词。' : selectedLetter && '请尝试选择其他字母。'}
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
