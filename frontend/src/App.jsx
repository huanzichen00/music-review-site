import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Albums from './pages/Albums';
import Login from './pages/Login';
import Register from './pages/Register';
import AlbumDetail from './pages/AlbumDetail';
import Favorites from './pages/Favorites';
import AddAlbum from './pages/AddAlbum';
import EditAlbum from './pages/EditAlbum';
import Profile from './pages/Profile';
import Artists from './pages/Artists';

// 暖色系主题配置
const warmTheme = {
  token: {
    colorPrimary: '#D4A574',        // 焦糖色主色
    colorBgContainer: '#FFFBF7',    // 卡片背景
    colorBgLayout: '#FDF5ED',       // 页面背景
    colorBgElevated: '#FFFFFF',     // 弹窗背景
    colorBorder: '#E8D5C4',         // 边框色
    colorText: '#5D4037',           // 主文字色
    colorTextSecondary: '#8D6E63',  // 次要文字色
    borderRadius: 8,                // 圆角
    colorLink: '#B8860B',           // 链接色
    colorSuccess: '#8BC34A',        // 成功色
    colorWarning: '#FFB74D',        // 警告色
    colorError: '#E57373',          // 错误色
  },
  components: {
    Button: {
      colorPrimary: '#C4956A',
      algorithm: true,
    },
    Card: {
      colorBgContainer: '#FFFCF8',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#FFF8E7',
      itemSelectedColor: '#FFE4B5',
      itemSelectedBg: 'rgba(255, 228, 181, 0.2)',
      itemHoverColor: '#FFE4B5',
      itemHoverBg: 'rgba(255, 228, 181, 0.1)',
    },
  },
};

function App() {
  return (
    <ConfigProvider theme={warmTheme}>
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/albums" element={<Albums />} />
              <Route path="/albums/:id" element={<AlbumDetail />} />
              <Route path="/albums/:id/edit" element={<EditAlbum />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/add-album" element={<AddAlbum />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/artists" element={<Artists />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
