import { Card, Rate, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// 自定义样式
const styles = {
  card: {
    width: '100%',
    maxWidth: 220,
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #FFFBF7 0%, #FFF2E6 100%)',
  },
  coverContainer: {
    height: 220,
    background: 'linear-gradient(145deg, #F5E6D3 0%, #E8D5C4 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transition: 'transform 0.3s ease',
  },
  placeholder: {
    fontSize: '64px',
    opacity: 0.6,
  },
  title: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '17px',
    fontWeight: 700,
    color: '#4E342E',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '4px',
  },
  artist: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
    fontSize: '15px',
    fontWeight: 600,
    color: '#6D4C41',
    display: 'block',
    marginBottom: '2px',
  },
  year: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '14px',
    fontWeight: 600,
    color: '#8D6E63',
  },
  rating: {
    marginTop: '8px',
  },
};

const AlbumCard = ({ album }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const resolveCoverUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? new URL(url, window.location.origin).toString() : url;
  };
  const themedStyles = isDark
    ? {
        card: {
          ...styles.card,
          background: 'linear-gradient(145deg, #1A1A1D 0%, #141417 100%)',
          border: '1px solid #2F2F33',
        },
        coverContainer: {
          ...styles.coverContainer,
          background: 'linear-gradient(145deg, #202024 0%, #18181B 100%)',
          borderBottom: '1px solid #2F2F33',
        },
        title: { ...styles.title, color: '#E5E7EB' },
        artist: { ...styles.artist, color: '#B8BDC7' },
        year: { ...styles.year, color: '#9CA3AF' },
        ratingColor: '#9CA3AF',
      }
    : {
        card: styles.card,
        coverContainer: styles.coverContainer,
        title: styles.title,
        artist: styles.artist,
        year: styles.year,
        ratingColor: '#D4A574',
      };

  return (
    <Card
      hoverable
      style={themedStyles.card}
      cover={
        <div style={themedStyles.coverContainer}>
          {album.coverUrl ? (
            <img 
              alt={album.title} 
              src={resolveCoverUrl(album.coverUrl)} 
              style={styles.coverImage}
              loading="lazy"
              decoding="async"
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            />
          ) : (
            <span style={{ ...styles.placeholder, fontSize: 14, letterSpacing: 1, color: isDark ? '#9CA3AF' : '#8D6E63' }}>
              NO COVER
            </span>
          )}
        </div>
      }
      onClick={() => navigate(`/music/albums/${album.id}`)}
      styles={{ body: { padding: '16px' } }}
    >
      <div style={themedStyles.title} title={album.title}>
        {album.title}
      </div>
      <div>
        <span style={themedStyles.artist}>
          {album.artistName}
        </span>
        {album.releaseYear && (
          <span style={themedStyles.year}>
            {album.releaseYear}
          </span>
        )}
        {album.averageRating !== undefined && album.averageRating !== null && (
          <div style={styles.rating}>
            <Rate 
              disabled 
              defaultValue={album.averageRating} 
              allowHalf 
              style={{ fontSize: '14px', color: themedStyles.ratingColor }} 
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default AlbumCard;
