import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AlbumDetail from './pages/AlbumDetail';
import Favorites from './pages/Favorites';
import AddAlbum from './pages/AddAlbum';
import Profile from './pages/Profile';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/albums" element={<Home />} />
              <Route path="/albums/:id" element={<AlbumDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/add-album" element={<AddAlbum />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </Layout>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
