import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Row, Col, Tag, Rate, Button, List, 
  Avatar, Spin, message, Modal, Form, Input, Divider 
} from 'antd';
import { 
  HeartOutlined, HeartFilled, EditOutlined, 
  DeleteOutlined, UserOutlined 
} from '@ant-design/icons';
import { albumsApi } from '../api/albums';
import { reviewsApi } from '../api/reviews';
import { favoritesApi } from '../api/favorites';
import { useAuth } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AlbumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [album, setAlbum] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAlbum();
  }, [id]);

  const loadAlbum = async () => {
    setLoading(true);
    try {
      const [albumRes, reviewsRes] = await Promise.all([
        albumsApi.getById(id),
        reviewsApi.getByAlbum(id),
      ]);
      setAlbum(albumRes.data);
      setReviews(reviewsRes.data);

      if (isAuthenticated) {
        const [favRes, myReviewRes] = await Promise.all([
          favoritesApi.checkFavorite(id),
          reviewsApi.getMyReviewForAlbum(id),
        ]);
        setIsFavorited(favRes.data.isFavorited);
        if (myReviewRes.data && myReviewRes.data.id) {
          setMyReview(myReviewRes.data);
        }
      }
    } catch (error) {
      message.error('Failed to load album');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      message.info('Please login to add favorites');
      navigate('/login');
      return;
    }

    try {
      if (isFavorited) {
        await favoritesApi.removeFavorite(id);
        setIsFavorited(false);
        message.success('Removed from favorites');
      } else {
        await favoritesApi.addFavorite(id);
        setIsFavorited(true);
        message.success('Added to favorites');
      }
    } catch (error) {
      message.error('Operation failed');
    }
  };

  const openReviewModal = () => {
    if (!isAuthenticated) {
      message.info('Please login to write a review');
      navigate('/login');
      return;
    }

    if (myReview) {
      form.setFieldsValue({
        rating: myReview.rating,
        content: myReview.content,
      });
    } else {
      form.resetFields();
    }
    setReviewModalVisible(true);
  };

  const handleSubmitReview = async (values) => {
    setSubmitting(true);
    try {
      await reviewsApi.createOrUpdate({
        albumId: parseInt(id),
        rating: values.rating,
        content: values.content,
      });
      message.success(myReview ? 'Review updated!' : 'Review submitted!');
      setReviewModalVisible(false);
      loadAlbum();
    } catch (error) {
      message.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsApi.delete(reviewId);
      message.success('Review deleted');
      setMyReview(null);
      loadAlbum();
    } catch (error) {
      message.error('Failed to delete review');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!album) return null;

  return (
    <div>
      <Row gutter={[32, 32]}>
        {/* Album Cover */}
        <Col xs={24} md={8}>
          <div style={{ 
            width: '100%', 
            paddingTop: '100%', 
            position: 'relative',
            background: '#f0f0f0',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {album.coverUrl ? (
              <img 
                src={album.coverUrl} 
                alt={album.title}
                style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '80px'
              }}>
                🎵
              </div>
            )}
          </div>
        </Col>

        {/* Album Info */}
        <Col xs={24} md={16}>
          <Title level={2}>{album.title}</Title>
          <Title level={4} type="secondary" style={{ marginTop: 0 }}>
            {album.artistName}
          </Title>

          <div style={{ marginBottom: '16px' }}>
            {album.releaseYear && <Tag color="blue">{album.releaseYear}</Tag>}
            {album.genres?.map((genre) => (
              <Tag key={genre.id} color="purple">{genre.name}</Tag>
            ))}
          </div>

          {album.averageRating !== null && (
            <div style={{ marginBottom: '16px' }}>
              <Rate disabled value={album.averageRating} allowHalf />
              <Text style={{ marginLeft: '8px' }}>
                {album.averageRating?.toFixed(1)} ({album.reviewCount} reviews)
              </Text>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <Button 
              type={isFavorited ? 'primary' : 'default'}
              icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleFavorite}
              style={{ marginRight: '8px' }}
            >
              {isFavorited ? 'Favorited' : 'Add to Favorites'}
            </Button>
            <Button 
              icon={<EditOutlined />}
              onClick={openReviewModal}
            >
              {myReview ? 'Edit Review' : 'Write Review'}
            </Button>
          </div>

          {album.description && (
            <Paragraph>{album.description}</Paragraph>
          )}
        </Col>
      </Row>

      {/* Track List */}
      {album.tracks && album.tracks.length > 0 && (
        <Card title="Track List" style={{ marginTop: '32px' }}>
          <List
            dataSource={album.tracks}
            renderItem={(track) => (
              <List.Item>
                <span style={{ marginRight: '16px', color: '#999' }}>
                  {track.trackNumber}.
                </span>
                <span style={{ flex: 1 }}>{track.title}</span>
                {track.formattedDuration && (
                  <span style={{ color: '#999' }}>{track.formattedDuration}</span>
                )}
              </List.Item>
            )}
          />
          {album.formattedTotalDuration && (
            <div style={{ textAlign: 'right', marginTop: '16px', color: '#999' }}>
              Total: {album.formattedTotalDuration}
            </div>
          )}
        </Card>
      )}

      {/* Reviews */}
      <Card title={`Reviews (${reviews.length})`} style={{ marginTop: '32px' }}>
        {reviews.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#999', padding: '24px' }}>
            No reviews yet. Be the first to review!
          </div>
        ) : (
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <List.Item
                actions={
                  user?.id === review.userId ? [
                    <Button 
                      type="text" 
                      icon={<EditOutlined />}
                      onClick={openReviewModal}
                    />,
                    <Button 
                      type="text" 
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleDeleteReview(review.id)}
                    />,
                  ] : []
                }
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} src={review.userAvatar} />}
                  title={
                    <div>
                      <span style={{ marginRight: '8px' }}>{review.username}</span>
                      <Rate disabled value={review.rating} allowHalf style={{ fontSize: '14px' }} />
                    </div>
                  }
                  description={
                    <div>
                      <Paragraph style={{ marginBottom: '4px' }}>{review.content}</Paragraph>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(review.createdAt).toLocaleDateString()}
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        title={myReview ? 'Edit Review' : 'Write Review'}
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitReview}
        >
          <Form.Item
            name="rating"
            label="Rating"
            rules={[{ required: true, message: 'Please select a rating' }]}
          >
            <Rate allowHalf />
          </Form.Item>
          <Form.Item
            name="content"
            label="Review"
          >
            <TextArea rows={4} placeholder="Write your review..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} block>
              {myReview ? 'Update Review' : 'Submit Review'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlbumDetail;
