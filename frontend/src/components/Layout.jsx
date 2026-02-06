import { Layout as AntLayout, Menu, Button, Dropdown, Avatar } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeOutlined, 
  UserOutlined, 
  HeartOutlined,
  LogoutOutlined,
  LoginOutlined,
  AppstoreOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

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
  const navigate = useNavigate();
  const location = useLocation();
  const resolveAvatarUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? new URL(url, window.location.origin).toString() : url;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/" style={menuLinkStyle}>首页</Link>,
      style: menuItemStyle,
    },
    {
      key: '/albums',
      icon: <AppstoreOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/albums" style={menuLinkStyle}>专辑</Link>,
      style: menuItemStyle,
    },
    {
      key: '/add-album',
      icon: <PlusOutlined style={{ fontSize: '18px' }} />,
      label: <Link to="/add-album" style={menuLinkStyle}>添加专辑</Link>,
      style: menuItemStyle,
    },
  ];

  const userMenuItems = [
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
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)',
        borderBottom: '1.5px solid #E8D5C4',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ 
            color: '#FFF8E7', 
            fontSize: '36px', 
            fontWeight: 700,
            marginRight: '40px',
            textShadow: '2px 2px 4px rgba(0,0,0,0.25)',
            fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
            letterSpacing: '1.5px',
          }}>
            好曲共鉴
          </Link>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
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
        
        <div>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={resolveAvatarUrl(user?.avatarUrl)} 
                  icon={!user?.avatarUrl && <UserOutlined />} 
                  size={44}
                  style={{ 
                    marginRight: 8,
                    border: '2px solid #FFE4B5',
                  }} 
                />
                <span style={{ 
                  color: '#FFF8E7', 
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
                  color: '#FFF8E7',
                  fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
                  fontSize: '20px',
                }}
              >
                登录
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                style={{ 
                  background: 'linear-gradient(135deg, #FFE4B5 0%, #F5DEB3 100%)',
                  border: 'none',
                  color: '#8B4513',
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
      
      <Content style={{ 
        padding: '24px 50px',
        background: 'transparent',
      }}>
        {children}
      </Content>
      
      <Footer style={{ 
        textAlign: 'center', 
        background: 'linear-gradient(180deg, #F5E6D3 0%, #EDE0D4 100%)',
        color: '#8D6E63',
        borderTop: '1px solid #E8D5C4',
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
