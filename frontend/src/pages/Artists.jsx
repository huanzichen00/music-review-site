import { useState, useEffect } from 'react';
import { Card, List, Button, message, Popconfirm, Typography, Row, Col, Tag } from 'antd';
import { DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { artistsApi } from '../api/artists';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Artists = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const response = await artistsApi.getAll();
      setArtists(response.data);
    } catch (error) {
      message.error('Failed to load artists');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtist = async (artistId) => {
    try {
      await artistsApi.delete(artistId);
      message.success('Artist deleted successfully');
      loadArtists();
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to delete artist');
    }
  };

  const canDelete = user?.username === 'Huan';

  return (
    <div>
      <Title level={2}>Artists</Title>
      
      <Card loading={loading}>
        <List
          itemLayout="horizontal"
          dataSource={artists}
          renderItem={(artist) => (
            <List.Item
              actions={
                canDelete
                  ? [
                      <Popconfirm
                        title="删除艺术家"
                        description={`确定要删除艺术家 "${artist.name}" 吗？只有没有专辑的艺术家才能被删除。`}
                        icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                        onConfirm={() => handleDeleteArtist(artist.id)}
                        okText="确定"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                        >
                          删除
                        </Button>
                      </Popconfirm>,
                    ]
                  : []
              }
            >
              <List.Item.Meta
                title={
                  <div>
                    <span style={{ 
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '18px',
                      fontWeight: 600,
                      color: '#4E342E',
                    }}>
                      {artist.name}
                    </span>
                    {artist.country && (
                      <Tag style={{ marginLeft: '8px' }}>{artist.country}</Tag>
                    )}
                    {artist.formedYear && (
                      <Tag style={{ marginLeft: '8px' }}>{artist.formedYear}</Tag>
                    )}
                  </div>
                }
                description={
                  <div>
                    {artist.description && (
                      <p style={{ 
                        fontFamily: "'Noto Serif SC', serif",
                        color: '#6D4C41',
                        marginTop: '4px',
                      }}>
                        {artist.description}
                      </p>
                    )}
                    {artist.albumCount > 0 && (
                      <span style={{ 
                        fontFamily: "'Cormorant Garamond', serif",
                        color: '#8D6E63',
                        fontSize: '14px',
                      }}>
                        {artist.albumCount} albums
                      </span>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default Artists;
