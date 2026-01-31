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
  fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
  fontSize: '17px',
  fontWeight: 500,
  letterSpacing: '0.5px',
};

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined style={{ fontSize: '16px' }} />,
      label: <Link to="/" style={menuLinkStyle}>Home</Link>,
    },
    {
      key: '/albums',
      icon: <AppstoreOutlined style={{ fontSize: '16px' }} />,
      label: <Link to="/albums" style={menuLinkStyle}>Albums</Link>,
    },
    {
      key: '/add-album',
      icon: <PlusOutlined style={{ fontSize: '16px' }} />,
      label: <Link to="/add-album" style={menuLinkStyle}>Add Album</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: <span style={menuLinkStyle}>My Favorites</span>,
      onClick: () => navigate('/favorites'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <span style={menuLinkStyle}>Profile</span>,
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: <span style={menuLinkStyle}>Logout</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 50px',
        background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
        boxShadow: '0 2px 8px rgba(139, 69, 19, 0.3)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ 
            color: '#FFF8E7', 
            fontSize: '24px', 
            fontWeight: 600,
            marginRight: '40px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
            fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
            letterSpacing: '1px',
          }}>
            🎵 Music Review
          </Link>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            disabledOverflow={true}
            style={{ 
              background: 'transparent',
              borderBottom: 'none',
              fontSize: '16px',
              minWidth: 'auto',
            }}
            theme="dark"
          />
        </div>
        
        <div>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  src={user?.avatarUrl} 
                  icon={!user?.avatarUrl && <UserOutlined />} 
                  style={{ 
                    marginRight: 8,
                    border: '2px solid #FFE4B5',
                  }} 
                />
                <span style={{ 
                  color: '#FFF8E7', 
                  fontWeight: 500,
                  fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
                  fontSize: '16px',
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
                  fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
                  fontSize: '16px',
                }}
              >
                Login
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                style={{ 
                  background: 'linear-gradient(135deg, #FFE4B5 0%, #F5DEB3 100%)',
                  border: 'none',
                  color: '#8B4513',
                  fontWeight: 500,
                  fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
                  fontSize: '16px',
                }}
              >
                Register
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
          fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
          fontSize: '15px',
        }}>
          Music Review Site ©{new Date().getFullYear()} - Built with React + Spring Boot
        </span>
      </Footer>
    </AntLayout>
  );
};

export default Layout;
