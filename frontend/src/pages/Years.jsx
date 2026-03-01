import { useEffect, useMemo, useState } from 'react';
import { Card, Col, Empty, Input, InputNumber, Row, Spin, Table, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { albumsApi } from '../api/albums';
import { artistsApi } from '../api/artists';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';

const { Title } = Typography;
const YEARS_PAGE_SIZE = 24;
const YEARS_SUMMARY_CACHE_KEY = 'years:summary:v1';
const YEARS_SUMMARY_CACHE_TTL_MS = 10 * 60 * 1000;

const styles = {
  pageTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '42px',
    fontWeight: 700,
    color: '#1F3D77',
    marginBottom: '24px',
    letterSpacing: '1px',
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
  const [yearKeyword, setYearKeyword] = useState('');
  const [minAlbumCount, setMinAlbumCount] = useState(undefined);
  const [minFormedBandCount, setMinFormedBandCount] = useState(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const controller = new AbortController();
    const readSummaryCache = () => {
      try {
        const raw = window.sessionStorage.getItem(YEARS_SUMMARY_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed?.updatedAt || Date.now() - parsed.updatedAt > YEARS_SUMMARY_CACHE_TTL_MS) {
          return null;
        }
        return parsed.summary || null;
      } catch {
        return null;
      }
    };
    const writeSummaryCache = (summary) => {
      try {
        window.sessionStorage.setItem(
          YEARS_SUMMARY_CACHE_KEY,
          JSON.stringify({ updatedAt: Date.now(), summary })
        );
      } catch {
        // Ignore storage write failures.
      }
    };
    const applySummary = (summary) => {
      setYears(summary.years || []);
      setAlbumCountByYear(new Map(Object.entries(summary.albumCountByYear || {}).map(([k, v]) => [Number(k), v])));
      setFormedBandCountByYear(new Map(Object.entries(summary.formedBandCountByYear || {}).map(([k, v]) => [Number(k), v])));
      setYearCoverByYear(new Map(Object.entries(summary.yearCoverByYear || {}).map(([k, v]) => [Number(k), v])));
    };
    const cachedSummary = readSummaryCache();
    if (cachedSummary) {
      applySummary(cachedSummary);
      setLoading(false);
    }

    const loadData = async () => {
      if (!cachedSummary) {
        setLoading(true);
      }
      try {
        const [yearsRes, albumsRes, artistsRes] = await Promise.all([
          albumsApi.getYears({ signal: controller.signal }),
          albumsApi.getAll({ signal: controller.signal }),
          artistsApi.getAll({ signal: controller.signal }),
        ]);

        const sortedYears = (yearsRes.data || []).slice().sort((a, b) => b - a);
        const allAlbums = albumsRes.data || [];
        const albumCountByYearObj = {};
        const yearCoverByYearObj = {};
        allAlbums.forEach((album) => {
          if (!album?.releaseYear) return;
          const year = Number(album.releaseYear);
          albumCountByYearObj[year] = (albumCountByYearObj[year] || 0) + 1;
          if (!yearCoverByYearObj[year] && album.coverUrl) {
            yearCoverByYearObj[year] = album.coverUrl;
          }
        });

        const allArtists = artistsRes.data || [];
        const formedBandCountByYearObj = {};
        allArtists.forEach((artist) => {
          if (!artist?.formedYear) return;
          const year = Number(artist.formedYear);
          formedBandCountByYearObj[year] = (formedBandCountByYearObj[year] || 0) + 1;
        });
        const summary = {
          years: sortedYears,
          albumCountByYear: albumCountByYearObj,
          formedBandCountByYear: formedBandCountByYearObj,
          yearCoverByYear: yearCoverByYearObj,
        };
        applySummary(summary);
        writeSummaryCache(summary);
      } catch (error) {
        if (isRequestCanceled(error)) {
          return;
        }
        if (!cachedSummary) {
          message.error('加载年份失败');
        }
      } finally {
        if (!cachedSummary) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => controller.abort();
  }, []);

  const yearCards = useMemo(
    () =>
      years.map((year) => ({
        key: year,
        year,
        albumCount: albumCountByYear.get(year) || 0,
        formedBandCount: formedBandCountByYear.get(year) || 0,
        coverUrl: yearCoverByYear.get(year) || '',
      })),
    [years, albumCountByYear, formedBandCountByYear, yearCoverByYear]
  );
  const filteredYearRows = useMemo(() => {
    const yearNeedle = yearKeyword.trim();
    return yearCards.filter((item) => {
      const yearMatch = !yearNeedle || String(item.year).includes(yearNeedle);
      const albumMatch = minAlbumCount == null || item.albumCount >= minAlbumCount;
      const formedMatch = minFormedBandCount == null || item.formedBandCount >= minFormedBandCount;
      return yearMatch && albumMatch && formedMatch;
    });
  }, [yearCards, yearKeyword, minAlbumCount, minFormedBandCount]);

  const themedStyles = useMemo(() => {
    if (!isDark) {
      return styles;
    }
    return {
      ...styles,
      pageTitle: { ...styles.pageTitle, color: '#E5E7EB' },
    };
  }, [isDark]);

  const columns = [
    {
      title: 'YEAR',
      dataIndex: 'year',
      key: 'year',
      width: 120,
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.year - b.year,
      render: (_, row) => (
        <span
          onClick={() => navigate(`/music/years/${row.year}`)}
          style={{
            cursor: 'pointer',
            fontWeight: 700,
            color: isDark ? '#E5E7EB' : '#4E342E',
            letterSpacing: '0.2px',
          }}
        >
          {row.year}
        </span>
      ),
    },
    {
      title: 'RELEASED ALBUMS',
      dataIndex: 'albumCount',
      key: 'albumCount',
      width: 180,
      sorter: (a, b) => a.albumCount - b.albumCount,
    },
    {
      title: 'FORMED BANDS',
      dataIndex: 'formedBandCount',
      key: 'formedBandCount',
      width: 180,
      sorter: (a, b) => a.formedBandCount - b.formedBandCount,
    },
    {
      title: 'ACTION',
      key: 'action',
      width: 160,
      render: (_, row) => (
        <a onClick={() => navigate(`/music/years/${row.year}`)}>查看详情</a>
      ),
    },
  ];

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
        <Card>
          <Row gutter={[12, 12]} style={{ marginBottom: 14 }}>
            <Col xs={24} sm={8} md={6}>
              <Input
                allowClear
                placeholder="按年份搜索，如 1998"
                value={yearKeyword}
                onChange={(e) => setYearKeyword(e.target.value)}
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="最低专辑数"
                value={minAlbumCount}
                onChange={setMinAlbumCount}
              />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                placeholder="最低成立乐队数"
                value={minFormedBandCount}
                onChange={setMinFormedBandCount}
              />
            </Col>
          </Row>

          <Table
            rowKey="key"
            columns={columns}
            dataSource={filteredYearRows}
            pagination={{
              pageSize: YEARS_PAGE_SIZE,
              showSizeChanger: false,
              hideOnSinglePage: true,
            }}
            size="middle"
          />
        </Card>
      )}
    </div>
  );
};

export default Years;
