import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Albums = lazy(() => import('./pages/Albums'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const AlbumDetail = lazy(() => import('./pages/AlbumDetail'));
const Favorites = lazy(() => import('./pages/Favorites'));
const AddAlbum = lazy(() => import('./pages/AddAlbum'));
const EditAlbum = lazy(() => import('./pages/EditAlbum'));
const Profile = lazy(() => import('./pages/Profile'));
const Artists = lazy(() => import('./pages/Artists'));
const ArtistDetail = lazy(() => import('./pages/ArtistDetail'));
const Genres = lazy(() => import('./pages/Genres'));
const GenreDetail = lazy(() => import('./pages/GenreDetail'));
const Years = lazy(() => import('./pages/Years'));
const YearDetail = lazy(() => import('./pages/YearDetail'));
const Blog = lazy(() => import('./pages/Blog'));
const Messages = lazy(() => import('./pages/Messages'));
const UserHome = lazy(() => import('./pages/UserHome'));
const GuessBand = lazy(() => import('./pages/GuessBand'));
const GuessBandBanks = lazy(() => import('./pages/GuessBandBanks'));
const GuessBandOnline = lazy(() => import('./pages/GuessBandOnline'));

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
    colorSuccess: '#FFB300',        // 成功色
    colorWarning: '#D4A574',        // 警告色
    colorError: '#E57373',          // 错误色
  },
  components: {
    Button: {
      colorPrimary: '#C4956A',
      algorithm: true,
    },
    Card: {
      colorBgContainer: '#FFFBF7',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#FDF5ED',
      itemSelectedColor: '#FFE4B5',
      itemSelectedBg: 'rgba(212, 165, 116, 0.2)',
      itemHoverColor: '#FFE4B5',
      itemHoverBg: 'rgba(212, 165, 116, 0.1)',
    },
  },
};

const blueTheme = {
  token: {
    colorPrimary: '#5B9BFF',
    colorBgContainer: '#F5F9FF',
    colorBgLayout: '#EEF4FF',
    colorBgElevated: '#FFFFFF',
    colorBorder: '#C9DDFB',
    colorText: '#274B7A',
    colorTextSecondary: '#6788AE',
    borderRadius: 8,
    colorLink: '#2B6FD6',
    colorSuccess: '#4DA3FF',
    colorWarning: '#5B9BFF',
    colorError: '#E57373',
  },
  components: {
    Button: {
      colorPrimary: '#4C86E8',
      algorithm: true,
    },
    Card: {
      colorBgContainer: '#F5F9FF',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#EEF4FF',
      itemSelectedColor: '#CFE2FF',
      itemSelectedBg: 'rgba(91, 155, 255, 0.22)',
      itemHoverColor: '#CFE2FF',
      itemHoverBg: 'rgba(91, 155, 255, 0.14)',
    },
  },
};

const darkTheme = {
  token: {
    colorPrimary: '#6B7280',
    colorBgContainer: '#141414',
    colorBgLayout: '#0E0E0F',
    colorBgElevated: '#1B1B1D',
    colorBorder: '#2F2F33',
    colorText: '#E5E7EB',
    colorTextSecondary: '#9CA3AF',
    borderRadius: 8,
    colorLink: '#D1D5DB',
    colorSuccess: '#9CA3AF',
    colorWarning: '#9CA3AF',
    colorError: '#9CA3AF',
  },
  components: {
    Button: {
      colorPrimary: '#4B5563',
      algorithm: true,
    },
    Card: {
      colorBgContainer: '#141414',
    },
    Menu: {
      itemBg: 'transparent',
      itemColor: '#D1D5DB',
      itemSelectedColor: '#F3F4F6',
      itemSelectedBg: 'rgba(255, 255, 255, 0.12)',
      itemHoverColor: '#E5E7EB',
      itemHoverBg: 'rgba(255, 255, 255, 0.08)',
    },
  },
};

function AppContent() {
  const { theme } = useTheme();

  useEffect(() => {
    const preload = () => {
      import('./pages/Albums');
      import('./pages/Artists');
      import('./pages/Genres');
      import('./pages/Years');
      import('./pages/GuessBand');
      import('./pages/GuessBandOnline');
      import('./pages/Blog');
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(preload, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timer = window.setTimeout(preload, 500);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <ConfigProvider theme={theme === 'blue' ? blueTheme : theme === 'dark' ? darkTheme : warmTheme}>
      <AuthProvider>
        <Router>
          <Layout>
            <Suspense fallback={<div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>}>
              <Routes>
                <Route path="/" element={<Navigate to="/music/home" replace />} />
                <Route path="/music" element={<Navigate to="/music/home" replace />} />
                <Route path="/music/home" element={<Home />} />
                <Route path="/music/albums" element={<Albums />} />
                <Route path="/music/artists" element={<Artists />} />
                <Route path="/music/artists/:id" element={<ArtistDetail />} />
                <Route path="/music/genres" element={<Genres />} />
                <Route path="/music/genres/:id" element={<GenreDetail />} />
                <Route path="/music/years" element={<Years />} />
                <Route path="/music/years/:year" element={<YearDetail />} />
                <Route path="/music/guess-band" element={<GuessBand />} />
                <Route path="/music/guess-band/banks" element={<GuessBandBanks />} />
                <Route path="/music/guess-band/online" element={<GuessBandOnline />} />
                <Route path="/music/albums/:id" element={<AlbumDetail />} />
                <Route path="/music/albums/:id/edit" element={<EditAlbum />} />
                <Route path="/music/add-album" element={<AddAlbum />} />
                <Route path="/guess-band" element={<GuessBand />} />
                <Route path="/guess-band/banks" element={<GuessBandBanks />} />
                <Route path="/guess-band/online" element={<GuessBandOnline />} />
                <Route path="/albums" element={<Albums />} />
                <Route path="/albums/:id" element={<AlbumDetail />} />
                <Route path="/albums/:id/edit" element={<EditAlbum />} />
                <Route path="/add-album" element={<AddAlbum />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/users/:id" element={<UserHome />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/artists/:id" element={<ArtistDetail />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/genres/:id" element={<GenreDetail />} />
                <Route path="/years" element={<Years />} />
                <Route path="/years/:year" element={<YearDetail />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="*" element={<Navigate to="/music/home" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
