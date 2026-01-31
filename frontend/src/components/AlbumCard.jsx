import { Card, Rate, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Meta } = Card;
const { Text } = Typography;

// 自定义样式
const styles = {
  card: {
    width: '100%',
    maxWidth: 220,
    borderRadius: '12px',
    overflow: 'hidden',
    background: 'linear-gradient(145deg, #FFFCF8 0%, #FFF8F0 100%)',
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
    fontWeight: 600,
    color: '#5D4037',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    marginBottom: '4px',
  },
  artist: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
    fontSize: '15px',
    color: '#8D6E63',
    display: 'block',
    marginBottom: '2px',
  },
  year: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '14px',
    color: '#A1887F',
  },
  rating: {
    marginTop: '8px',
  },
};

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      style={styles.card}
      cover={
        <div style={styles.coverContainer}>
          {album.coverUrl ? (
            <img 
              alt={album.title} 
              src={album.coverUrl} 
              style={styles.coverImage}
              onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            />
          ) : (
            <span style={styles.placeholder}>🎵</span>
          )}
        </div>
      }
      onClick={() => navigate(`/albums/${album.id}`)}
      bodyStyle={{ padding: '16px' }}
    >
      <div style={styles.title} title={album.title}>
        {album.title}
      </div>
      <div>
        <span style={styles.artist}>
          {album.artistName}
        </span>
        {album.releaseYear && (
          <span style={styles.year}>
            {album.releaseYear}
          </span>
        )}
        {album.averageRating !== undefined && album.averageRating !== null && (
          <div style={styles.rating}>
            <Rate 
              disabled 
              defaultValue={album.averageRating} 
              allowHalf 
              style={{ fontSize: '14px', color: '#D4A574' }} 
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default AlbumCard;
