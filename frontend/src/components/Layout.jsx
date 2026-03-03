import { useCallback, useEffect, useState } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar, Badge, Select, Space } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  UserOutlined, 
  BellOutlined,
  HeartOutlined,
  LogoutOutlined,
  LoginOutlined,
  AppstoreOutlined,
  HomeOutlined,
  BookOutlined,
  CustomerServiceOutlined,
  TagsOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resolveAvatarUrl } from '../utils/avatar';
import { notificationsApi } from '../api/notifications';

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

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const isBlue = theme === 'blue';
  const isDark = theme === 'dark';

  const refreshUnreadCount = useCallback(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    notificationsApi.getUnreadCount()
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

  const handleLogout = () => {
    logout();
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
      icon: <AppstoreOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/music/home" style={menuLinkStyle}>音乐</Link>,
      style: menuItemStyle,
    },
    {
      key: '/music/guess-band',
      icon: <CustomerServiceOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/music/guess-band" style={menuLinkStyle}>Guess-Band</Link>,
      style: menuItemStyle,
    },
    {
      key: '/blog',
      icon: <BookOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/blog" style={menuLinkStyle}>博客</Link>,
      style: menuItemStyle,
    },
  ];

  const userMenuItems = [
    {
      key: 'messages',
      icon: (
        <Badge count={unreadCount} size="small" offset={[6, -2]}>
          <BellOutlined />
        </Badge>
      ),
      label: <span style={menuLinkStyle}>消息中心</span>,
      onClick: () => navigate('/messages'),
    },
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <span style={menuLinkStyle}>我的收藏</span>,
      onClick: () => navigate('/favorites'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span style={menuLinkStyle}>个人资料</span>,
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span style={menuLinkStyle}>退出登录</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/music/home" style={{ 
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
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Space align="center">
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
                  style={{ 
                    marginRight: 8,
                    border: isDark ? '2px solid #4B5563' : isBlue ? '2px solid #CFE2FF' : '2px solid #FFE4B5',
                  }} 
                />
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
            <div>
              <Button 
                type="text" 
                icon={<LoginOutlined />}
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
      <div style={{ padding: '10px 50px 0' }}>
        <div
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
            icon={<HomeOutlined />}
            onClick={() => navigate('/music/home')}
          >
            首页
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/albums' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => navigate('/music/albums')}
          >
            专辑
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/artists' ? 'primary' : 'default'}
            icon={<UserOutlined />}
            onClick={() => navigate('/music/artists')}
          >
            乐队
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/genres' ? 'primary' : 'default'}
            icon={<TagsOutlined />}
            onClick={() => navigate('/music/genres')}
          >
            风格
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/years' ? 'primary' : 'default'}
            icon={<CalendarOutlined />}
            onClick={() => navigate('/music/years')}
          >
            年份
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/guess-band' ? 'primary' : 'default'}
            icon={<CustomerServiceOutlined />}
            onClick={() => navigate('/music/guess-band')}
          >
            猜乐队
          </Button>
          <Button
            type={selectedMusicSubKey === '/music/add-album' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => navigate('/music/add-album')}
          >
            添加专辑
          </Button>
        </div>
      </div>
      )}
      
      <Content style={{ 
        padding: '24px 50px',
        background: 'transparent',
      }}>
        {children}
      </Content>
      
      <Footer style={{ 
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
