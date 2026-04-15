import { useCallback, useEffect, useRef, useState } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Badge, Select, Space, Tooltip } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resolveAvatarUrl } from '../utils/avatar';

const { Header, Content, Footer } = AntLayout;

// 导航菜单链接样式
const menuLinkStyle = {
  fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
  fontSize: '20px',
  fontWeight: 500,
  letterSpacing: '0.5px',
};
const menuItemStyle = {
  fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
  fontSize: '20px',
};
const menuGlyphStyle = {
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
};
const glyph = (text) => <span style={menuGlyphStyle}>{text}</span>;
const githubRepoUrl = 'https://github.com/huanzichen00/music-review-site';

const GithubMark = ({ color }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="currentColor"
    style={{ display: 'block', color }}
  >
    <path d="M12 .5C5.65.5.5 5.66.5 12.02c0 5.09 3.29 9.4 7.86 10.92.57.1.78-.25.78-.56 0-.28-.01-1.2-.02-2.17-3.2.7-3.88-1.36-3.88-1.36-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.19 1.18a11.1 11.1 0 0 1 5.8 0c2.22-1.49 3.19-1.18 3.19-1.18.63 1.6.23 2.78.11 3.07.74.81 1.19 1.83 1.19 3.09 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.06.78 2.14 0 1.54-.01 2.79-.01 3.17 0 .31.2.67.79.56A11.53 11.53 0 0 0 23.5 12.02C23.5 5.66 18.35.5 12 .5Z" />
  </svg>
);

const routePrefetchers = {
  '/music/guess-band': () => import('../pages/GuessBand'),
  '/music/guess-band/online': () => import('../pages/GuessBandOnline'),
};

const markGuessBandRouteStart = () => {
  if (typeof performance === 'undefined') {
    return;
  }
  try {
    const navId = `gb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = performance.now();
    if (typeof window !== 'undefined') {
      window.__gb_metrics = {
        ...(window.__gb_metrics || {}),
        navId,
        routeStartAt: now,
        routeStartEpoch: Date.now(),
        listBuildMs: [],
      };
    }
    if (typeof performance.clearMarks === 'function') {
      performance.clearMarks('gb_route_start');
      performance.clearMarks('gb_chunk_loaded');
      performance.clearMarks('gb_api_start');
      performance.clearMarks('gb_api_done');
      performance.clearMarks('gb_first_commit');
    }
    if (typeof performance.clearMeasures === 'function') {
      performance.clearMeasures('gb_m_route_to_chunk');
      performance.clearMeasures('gb_m_chunk_to_api_done');
      performance.clearMeasures('gb_m_api_to_commit');
      performance.clearMeasures('gb_m_total');
    }
    if (typeof performance.mark === 'function') {
      performance.mark('gb_route_start');
    }
  } catch {
    // ignore
  }
};

const warmGuessBandApiCache = async (isAuthenticated) => {
  try {
    const [{ questionBanksApi }] = await Promise.all([
      import('../api/questionBanks'),
    ]);
    questionBanksApi.getPublicCached({ force: true }).catch(() => {});
    if (isAuthenticated) {
      questionBanksApi.getMineCached({ force: true }).catch(() => {});
    }
  } catch {
    // ignore warm-up failures
  }
};

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const hasIdleWarmTriggeredRef = useRef(false);
  const prefetchedRoutesRef = useRef(new Set());
  const onlinePrefetchTimerRef = useRef(null);
  const isBlue = theme === 'blue';
  const isDark = theme === 'dark';

  const prefetchRoute = useCallback((path) => {
    const load = routePrefetchers[path];
    if (!load) {
      return;
    }
    if (prefetchedRoutesRef.current.has(path)) {
      return;
    }
    prefetchedRoutesRef.current.add(path);
    load();
  }, []);

  const prefetchGuessBandNextHops = useCallback(() => {
    prefetchRoute('/music/guess-band');
    if (prefetchedRoutesRef.current.has('/music/guess-band/online')) {
      return;
    }
    if (onlinePrefetchTimerRef.current != null || typeof window === 'undefined') {
      return;
    }
    // Split into a second, delayed prefetch to avoid a burst of concurrent chunk work.
    onlinePrefetchTimerRef.current = window.setTimeout(() => {
      onlinePrefetchTimerRef.current = null;
      prefetchRoute('/music/guess-band/online');
    }, 350);
  }, [prefetchRoute]);

  const refreshUnreadCount = useCallback(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    import('../api/notifications')
      .then(({ notificationsApi }) => notificationsApi.getUnreadCount())
      .then((res) => setUnreadCount(res?.data?.unreadCount || 0))
      .catch(() => setUnreadCount(0));
  }, [isAuthenticated]);

  useEffect(() => {
    Promise.resolve().then(() => {
      refreshUnreadCount();
    });
  }, [refreshUnreadCount, location.pathname]);

  useEffect(() => {
    const handleNotificationUpdated = () => refreshUnreadCount();
    window.addEventListener('notifications-updated', handleNotificationUpdated);
    return () => window.removeEventListener('notifications-updated', handleNotificationUpdated);
  }, [refreshUnreadCount]);

  useEffect(() => {
    if (hasIdleWarmTriggeredRef.current) {
      return;
    }
    const isGuessBandRoute = location.pathname.startsWith('/music/guess-band') || location.pathname.startsWith('/guess-band');
    if (isGuessBandRoute) {
      return;
    }
    hasIdleWarmTriggeredRef.current = true;
    const runWarm = () => {
      if (import.meta.env.DEV) {
        console.log('qb_idle_prefetch_triggered', {
          pathname: location.pathname,
          isAuthenticated,
        });
      }
      warmGuessBandApiCache(isAuthenticated);
    };
    let timer = null;
    let idleId = null;
    if (typeof window !== 'undefined' && typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(runWarm, { timeout: 2000 });
    } else {
      timer = window.setTimeout(runWarm, 1000);
    }
    return () => {
      if (idleId != null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
      if (timer != null) {
        window.clearTimeout(timer);
      }
    };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => () => {
    if (onlinePrefetchTimerRef.current != null) {
      window.clearTimeout(onlinePrefetchTimerRef.current);
      onlinePrefetchTimerRef.current = null;
    }
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/music/home');
  };

  const getSelectedMenuKey = (pathname) => {
    if (pathname.startsWith('/music/guess-band') || pathname.startsWith('/guess-band')) {
      return '/music/guess-band';
    }
    if (
      pathname === '/' ||
      pathname === '/music' ||
      pathname.startsWith('/music/') ||
      pathname.startsWith('/albums') ||
      pathname.startsWith('/add-album')
    ) {
      return '/music';
    }
    if (pathname.startsWith('/blog')) {
      return '/blog';
    }
    return pathname;
  };

  const selectedMenuKey = getSelectedMenuKey(location.pathname);
  const isMusicSection =
    location.pathname === '/' ||
    location.pathname === '/music' ||
    location.pathname.startsWith('/music/') ||
    location.pathname.startsWith('/guess-band') ||
    location.pathname.startsWith('/albums') ||
    location.pathname.startsWith('/add-album');
  const selectedMusicSubKey = (() => {
    if (location.pathname.startsWith('/music/guess-band') || location.pathname.startsWith('/guess-band')) {
      return '/music/guess-band';
    }
    if (location.pathname.startsWith('/music/add-album') || location.pathname.startsWith('/add-album')) {
      return '/music/add-album';
    }
    if (location.pathname.startsWith('/music/albums') || location.pathname.startsWith('/albums')) {
      return '/music/albums';
    }
    if (location.pathname.startsWith('/music/artists') || location.pathname.startsWith('/artists')) {
      return '/music/artists';
    }
    if (location.pathname.startsWith('/music/genres') || location.pathname.startsWith('/genres')) {
      return '/music/genres';
    }
    if (location.pathname.startsWith('/music/years') || location.pathname.startsWith('/years')) {
      return '/music/years';
    }
    return '/music/home';
  })();

  const menuItems = [
    {
      key: '/music',
      label: <Link to="/music/home" style={menuLinkStyle}>音乐</Link>,
      style: menuItemStyle,
    },
    {
      key: '/music/guess-band',
      label: (
        <Link
          to="/music/guess-band"
          style={menuLinkStyle}
          onMouseEnter={() => {
            prefetchGuessBandNextHops();
            warmGuessBandApiCache(isAuthenticated);
          }}
          onClick={() => {
            markGuessBandRouteStart();
            prefetchGuessBandNextHops();
            warmGuessBandApiCache(isAuthenticated);
          }}
        >
          Guess-Band
        </Link>
      ),
      style: menuItemStyle,
    },
    {
      key: '/blog',
      label: <Link to="/blog" style={menuLinkStyle}>博客</Link>,
      style: menuItemStyle,
    },
  ];

  const userMenuItems = [
    {
      key: 'messages',
      label: (
        <Space size={8}>
          <span style={menuLinkStyle}>消息中心</span>
          <Badge count={unreadCount} size="small" />
        </Space>
      ),
      onClick: () => navigate('/messages'),
    },
    {
      key: 'favorites',
      label: <span style={menuLinkStyle}>我的收藏</span>,
      onClick: () => navigate('/favorites'),
    },
    {
      key: 'profile',
      label: <span style={menuLinkStyle}>个人资料</span>,
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: <span style={menuLinkStyle}>退出登录</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header className="app-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '88px',
        lineHeight: '88px',
        padding: '0 50px',
        background: isDark
          ? 'linear-gradient(135deg, #0F0F10 0%, #151517 50%, #1B1B1F 100%)'
          : isBlue
          ? 'linear-gradient(135deg, #1E4F9E 0%, #2E6FC4 50%, #5A97EF 100%)'
          : 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
        boxShadow: isDark
          ? '0 2px 10px rgba(0, 0, 0, 0.45)'
          : isBlue
            ? '0 2px 8px rgba(30, 79, 158, 0.3)'
            : '0 2px 8px rgba(139, 69, 19, 0.3)',
        borderBottom: isDark ? '1.5px solid #2F2F33' : isBlue ? '1.5px solid #C9DDFB' : '1.5px solid #E8D5C4',
      }}>
        <div className="app-header-left" style={{ display: 'flex', alignItems: 'center' }}>
          <Link className="app-brand-link" to="/music/home" style={{ 
            color: isDark ? '#E5E7EB' : isBlue ? '#EEF4FF' : '#FFF8E7',
            fontSize: '34px', 
            fontWeight: 700,
            marginRight: '40px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.25)',
            fontFamily: "'Playfair Display', 'Noto Sans SC', sans-serif",
            letterSpacing: '0.8px',
            lineHeight: 1.05,
            display: 'inline-flex',
            flexDirection: 'column',
          }}>
            <span>Music</span>
            <span>Review</span>
          </Link>
          <Menu
            mode="horizontal"
            selectedKeys={[selectedMenuKey]}
            items={menuItems}
            disabledOverflow={true}
            className="nav-menu"
            style={{ 
              background: 'transparent',
              borderBottom: 'none',
              fontSize: '18px',
              minWidth: 'auto',
              fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
            }}
            theme="dark"
          />
        </div>
        
        <div className="app-header-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Tooltip title="GitHub 仓库" placement="bottom">
            <a
              href={githubRepoUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Open GitHub repository"
              className="app-github-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: isDark
                  ? 'rgba(229, 231, 235, 0.12)'
                  : isBlue
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(255, 248, 231, 0.18)',
                border: isDark ? '1px solid #4B5563' : isBlue ? '1px solid #D8E7FF' : '1px solid #F7D8A8',
                color: isDark ? '#E5E7EB' : isBlue ? '#F8FBFF' : '#FFF8E7',
                boxShadow: isDark
                  ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                  : isBlue
                  ? '0 4px 12px rgba(30, 79, 158, 0.22)'
                  : '0 4px 12px rgba(139, 69, 19, 0.18)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <GithubMark color="currentColor" />
            </a>
          </Tooltip>
          <Space align="center" className="app-theme-switcher">
            <span
              style={{
                color: isDark ? '#D1D5DB' : isBlue ? '#EEF4FF' : '#FFF8E7',
                fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
                fontSize: 16,
              }}
            >
              主题
            </span>
            <Select
              size="middle"
              value={theme}
              onChange={setTheme}
              style={{ width: 120 }}
              options={[
                { value: 'warm', label: '暖色' },
                { value: 'blue', label: '蓝色' },
                { value: 'dark', label: '黑夜' },
              ]}
            />
          </Space>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={resolveAvatarUrl(user?.avatarUrl)} 
                  size={44}
                  alt={user?.username || 'user avatar'}
                  style={{ 
                    marginRight: 8,
                    border: isDark ? '2px solid #4B5563' : isBlue ? '2px solid #CFE2FF' : '2px solid #FFE4B5',
                  }} 
                >
                  {user?.username?.slice(0, 1)?.toUpperCase() || 'U'}
                </Avatar>
                <span style={{ 
                  color: isDark ? '#E5E7EB' : isBlue ? '#EEF4FF' : '#FFF8E7',
                  fontWeight: 500,
                  fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
                  fontSize: '20px',
                }}>
                  {user?.username}
                </span>
              </div>
            </Dropdown>
          ) : (
            <div className="app-auth-actions">
              <Button 
                type="text" 
                onClick={() => navigate('/login')}
                style={{ 
                  color: isDark ? '#D1D5DB' : isBlue ? '#EEF4FF' : '#FFF8E7',
                  fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
                  fontSize: '20px',
                }}
              >
                登录
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                style={{ 
                  background: isDark
                    ? 'linear-gradient(135deg, #2B2B2F 0%, #232327 100%)'
                    : isBlue
                    ? 'linear-gradient(135deg, #CFE2FF 0%, #BCD7FF 100%)'
                    : 'linear-gradient(135deg, #FFE4B5 0%, #F5DEB3 100%)',
                  border: 'none',
                  color: isDark ? '#E5E7EB' : isBlue ? '#1E4F9E' : '#8B4513',
                  fontWeight: 500,
                  fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
                  fontSize: '20px',
                }}
              >
                注册
              </Button>
            </div>
          )}
        </div>
      </Header>

      {isMusicSection && (
      <div className="music-subnav-wrap" style={{ padding: '10px 50px 0' }}>
        <div
          className="music-subnav-rail"
          style={{
            display: 'inline-flex',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 10,
            border: isDark ? '1px solid #2F2F33' : isBlue ? '1px solid #C9DDFB' : '1px solid #E8D5C4',
            background: isDark
              ? 'linear-gradient(180deg, #171719 0%, #131316 100%)'
              : isBlue
              ? 'linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 100%)'
              : 'linear-gradient(180deg, #FFF8EF 0%, #FFF2E6 100%)',
            boxShadow: isDark
              ? '0 1px 6px rgba(0, 0, 0, 0.32)'
              : isBlue
                ? '0 1px 4px rgba(30, 79, 158, 0.08)'
                : '0 1px 4px rgba(139, 69, 19, 0.08)',
          }}
        >
          <Button
            type={selectedMusicSubKey === '/music/home' ? 'primary' : 'default'}
            onClick={() => navigate('/music/home')}
          >
            首页
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/albums' ? 'primary' : 'default'}
            onClick={() => navigate('/music/albums')}
          >
            专辑
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/artists' ? 'primary' : 'default'}
            onClick={() => navigate('/music/artists')}
          >
            乐队
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/genres' ? 'primary' : 'default'}
            onClick={() => navigate('/music/genres')}
          >
            风格
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/years' ? 'primary' : 'default'}
            onClick={() => navigate('/music/years')}
          >
            年份
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/guess-band' ? 'primary' : 'default'}
            onClick={() => {
              markGuessBandRouteStart();
              navigate('/music/guess-band');
            }}
          >
            猜乐队
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/add-album' ? 'primary' : 'default'}
            onClick={() => navigate('/music/add-album')}
          >
            添加专辑
          </Button>
        </div>
      </div>
      )}
      
      <Content className="app-content" style={{ 
        padding: '24px 50px',
        background: 'transparent',
      }}>
        {children}
      </Content>
      
      <Footer className="app-footer" style={{ 
        textAlign: 'center', 
        background: isDark
          ? 'linear-gradient(180deg, #111113 0%, #0D0D0F 100%)'
          : isBlue
          ? 'linear-gradient(180deg, #DFECFF 0%, #D5E6FF 100%)'
          : 'linear-gradient(180deg, #F5E6D3 0%, #EDE0D4 100%)',
        color: isDark ? '#9CA3AF' : isBlue ? '#6788AE' : '#8D6E63',
        borderTop: isDark ? '1px solid #2F2F33' : isBlue ? '1px solid #C9DDFB' : '1px solid #E8D5C4',
        padding: '16px 50px',
      }}>
        <span style={{ 
          fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
          fontSize: '16px',
        }}>
          好曲共鉴 ©{new Date().getFullYear()} - 使用 React + Spring Boot 构建
        </span>
      </Footer>
    </AntLayout>
  );
};

export default Layout;
