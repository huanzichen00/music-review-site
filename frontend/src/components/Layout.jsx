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
      icon: <HomeOutlined />,
      label: <Link to="/">Home</Link>,
    },
    {
      key: '/albums',
      icon: <AppstoreOutlined />,
      label: <Link to="/albums">Albums</Link>,
    },
    ...(isAuthenticated ? [{
      key: '/add-album',
      icon: <PlusOutlined />,
      label: <Link to="/add-album">Add Album</Link>,
    }] : []),
  ];

  const userMenuItems = [
    {
      key: 'favorites',
      icon: <HeartOutlined />,
      label: 'My Favorites',
      onClick: () => navigate('/favorites'),
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
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
        background: '#001529'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ 
            color: '#fff', 
            fontSize: '20px', 
            fontWeight: 'bold',
            marginRight: '40px'
          }}>
            🎵 Music Review
          </Link>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
        
        <div>
          {isAuthenticated ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                <span style={{ color: '#fff' }}>{user?.username}</span>
              </div>
            </Dropdown>
          ) : (
            <div>
              <Button 
                type="text" 
                icon={<LoginOutlined />}
                onClick={() => navigate('/login')}
                style={{ color: '#fff' }}
              >
                Login
              </Button>
              <Button 
                type="primary"
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </div>
          )}
        </div>
      </Header>
      
      <Content style={{ padding: '24px 50px' }}>
        {children}
      </Content>
      
      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        Music Review Site ©{new Date().getFullYear()} - Built with React + Spring Boot
      </Footer>
    </AntLayout>
  );
};

export default Layout;
