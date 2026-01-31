import { Card, Rate, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Meta } = Card;
const { Text } = Typography;

const AlbumCard = ({ album }) => {
  const navigate = useNavigate();

  return (
    <Card
      hoverable
      style={{ width: 200 }}
      cover={
        <div style={{ 
          height: 200, 
          background: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {album.coverUrl ? (
            <img 
              alt={album.title} 
              src={album.coverUrl} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '48px' }}>🎵</span>
          )}
        </div>
      }
      onClick={() => navigate(`/albums/${album.id}`)}
    >
      <Meta
        title={
          <div style={{ 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis' 
          }}>
            {album.title}
          </div>
        }
        description={
          <div>
            <Text type="secondary" style={{ display: 'block' }}>
              {album.artistName}
            </Text>
            {album.releaseYear && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {album.releaseYear}
              </Text>
            )}
            {album.averageRating !== undefined && album.averageRating !== null && (
              <div style={{ marginTop: '8px' }}>
                <Rate disabled defaultValue={album.averageRating} allowHalf style={{ fontSize: '12px' }} />
              </div>
            )}
          </div>
        }
      />
    </Card>
  );
};

export default AlbumCard;
