import { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Typography, Card, Row, Col, Tag, Rate, Button, List, 
  Avatar, Spin, message, Modal, Form, Input, Divider, Popconfirm 
} from 'antd';
import { 
  HeartOutlined, HeartFilled, EditOutlined, 
  DeleteOutlined, MessageOutlined,
  SendOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { albumsApi } from '../api/albums';
import { reviewsApi } from '../api/reviews';
import { favoritesApi } from '../api/favorites';
import { repliesApi } from '../api/replies';
import { useAuth } from '../context/AuthContext';
import { resolveAvatarUrl } from '../utils/avatar';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 自定义样式
const styles = {
  albumTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '38px',
    fontWeight: 700,
    color: '#4E342E',
    marginBottom: '8px',
    lineHeight: 1.3,
  },
  artistName: {
    fontFamily: "'Cormorant Garamond', 'Noto Serif SC', Georgia, serif",
    fontSize: '24px',
    fontWeight: 600,
    color: '#6D4C41',
    marginTop: '0',
    cursor: 'pointer',
    textDecoration: 'none',
  },
  coverContainer: {
    width: '100%',
    paddingTop: '100%',
    position: 'relative',
    background: 'linear-gradient(145deg, #F5E6D3 0%, #E8D5C4 100%)',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(139, 69, 19, 0.2)',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  tag: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '14px',
    fontWeight: 600,
    padding: '4px 12px',
    borderRadius: '16px',
  },
  description: {
    fontFamily: "'Noto Serif SC', Georgia, serif",
    fontSize: '16px',
    fontWeight: 500,
    lineHeight: 1.8,
    color: '#5D4037',
  },
  cardTitle: {
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
    fontSize: '24px',
    fontWeight: 700,
    color: '#4E342E',
  },
  trackNumber: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '16px',
    fontWeight: 600,
    marginRight: '16px',
    color: '#8D6E63',
    minWidth: '30px',
  },
  trackTitle: {
    fontFamily: "'Noto Serif SC', Georgia, serif",
    fontSize: '16px',
    fontWeight: 500,
    flex: 1,
    color: '#4E342E',
  },
  trackDuration: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '15px',
    fontWeight: 600,
    color: '#8D6E63',
  },
  reviewUsername: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '17px',
    fontWeight: 700,
    color: '#4E342E',
    marginRight: '12px',
  },
  reviewContent: {
    fontFamily: "'Noto Serif SC', Georgia, serif",
    fontSize: '15px',
    fontWeight: 500,
    lineHeight: 1.7,
    color: '#5D4037',
  },
  emptyText: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '16px',
    textAlign: 'center',
    color: '#A1887F',
    padding: '32px',
  },
  replyContainer: {
    marginLeft: '56px',
    marginTop: '12px',
    padding: '12px 16px',
    background: 'linear-gradient(145deg, #FFF2E6 0%, #F5E6D3 100%)',
    borderRadius: '8px',
    borderLeft: '3px solid #D4A574',
  },
  replyUsername: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '14px',
    fontWeight: 700,
    color: '#5D4037',
  },
  replyContent: {
    fontFamily: "'Noto Serif SC', serif",
    fontSize: '14px',
    fontWeight: 500,
    color: '#6D4C41',
    marginTop: '4px',
  },
  replyDate: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: '12px',
    color: '#A1887F',
  },
};

const AlbumDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const resolveCoverUrl = (url) => {
    if (!url) return '';
    return url.startsWith('/api') ? new URL(url, window.location.origin).toString() : url;
  };
  const { isAuthenticated, user } = useAuth();
  
  const [album, setAlbum] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewReplies, setReviewReplies] = useState({});
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});

  const loadAlbum = useCallback(async () => {
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
    } catch {
      message.error('加载专辑失败');
      navigate('/music/home');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, navigate]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  const handleEditAlbum = () => {
    navigate(`/music/albums/${id}/edit`);
  };

  const loadReplies = async (reviewId) => {
    try {
      const response = await repliesApi.getByReview(reviewId);
      setReviewReplies(prev => ({
        ...prev,
        [reviewId]: response.data
      }));
    } catch {
      message.error('加载回复失败');
    }
  };

  const toggleReplies = async (reviewId) => {
    if (expandedReplies[reviewId]) {
      setExpandedReplies(prev => ({ ...prev, [reviewId]: false }));
    } else {
      if (!reviewReplies[reviewId]) {
        await loadReplies(reviewId);
      }
      setExpandedReplies(prev => ({ ...prev, [reviewId]: true }));
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      message.info('请先登录后再收藏');
      navigate('/login');
      return;
    }

    try {
      if (isFavorited) {
        await favoritesApi.removeFavorite(id);
        setIsFavorited(false);
        message.success('已取消收藏');
      } else {
        await favoritesApi.addFavorite(id);
        setIsFavorited(true);
        message.success('已加入收藏');
      }
    } catch {
      message.error('操作失败');
    }
  };

  const openReviewModal = () => {
    if (!isAuthenticated) {
      message.info('请先登录后再写评论');
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
      message.success(myReview ? '评论已更新！' : '评论已提交！');
      setReviewModalVisible(false);
      loadAlbum();
    } catch {
      message.error('提交评论失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewsApi.delete(reviewId);
      message.success('评论已删除');
      setMyReview(null);
      loadAlbum();
    } catch {
      message.error('删除评论失败');
    }
  };

  const handleSubmitReply = async (reviewId) => {
    if (!isAuthenticated) {
      message.info('请先登录后再回复');
      navigate('/login');
      return;
    }

    if (!replyContent.trim()) {
      message.warning('请输入回复内容');
      return;
    }

    setSubmittingReply(true);
    try {
      await repliesApi.create({
        reviewId: reviewId,
        content: replyContent,
      });
      message.success('回复已提交！');
      setReplyContent('');
      setReplyingTo(null);
      await loadReplies(reviewId);
      setExpandedReplies(prev => ({ ...prev, [reviewId]: true }));
    } catch {
      message.error('提交回复失败');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (replyId, reviewId) => {
    try {
      await repliesApi.delete(replyId);
      message.success('回复已删除');
      await loadReplies(reviewId);
    } catch {
      message.error('删除回复失败');
    }
  };

  const handleDeleteAlbum = async () => {
    try {
      await albumsApi.delete(id);
      message.success('专辑已删除');
      navigate('/music/home');
    } catch (error) {
      message.error(error.response?.data?.error || '删除专辑失败');
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
      <Row gutter={[40, 32]}>
        {/* Album Cover */}
        <Col xs={24} md={8}>
          <div style={styles.coverContainer}>
            {album.coverUrl ? (
              <img 
                src={resolveCoverUrl(album.coverUrl)} 
                alt={album.title}
                style={styles.coverImage}
              />
            ) : (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '100px',
                opacity: 0.5,
              }}>
                🎵
              </div>
            )}
          </div>
        </Col>

        {/* Album Info */}
        <Col xs={24} md={16}>
          <h1 style={styles.albumTitle}>{album.title}</h1>
          <h2
            style={styles.artistName}
            onClick={() => {
              if (album.artistId) {
                navigate(`/music/artists/${album.artistId}`);
              }
            }}
          >
            {album.artistName}
          </h2>

          <div style={{ marginBottom: '20px', marginTop: '16px' }}>
            {album.releaseYear && (
              <Tag
                color="orange"
                style={{ ...styles.tag, cursor: 'pointer' }}
                onClick={() => navigate(`/music/years/${album.releaseYear}`)}
              >
                {album.releaseYear}
              </Tag>
            )}
            {album.genres?.map((genre) => (
              <Tag
                key={genre.id}
                color="gold"
                style={{ ...styles.tag, cursor: 'pointer' }}
                onClick={() => navigate(`/music/genres/${genre.id}`)}
              >
                {genre.name}
              </Tag>
            ))}
          </div>

          {album.averageRating !== null && (
            <div style={{ marginBottom: '20px' }}>
              <Rate 
                disabled 
                value={album.averageRating} 
                allowHalf 
                style={{ fontSize: '20px', color: '#D4A574' }}
              />
              <Text style={{ 
                marginLeft: '12px', 
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '18px',
                color: '#8D6E63',
              }}>
                {album.averageRating?.toFixed(1)}（{album.reviewCount} 条评论）
              </Text>
            </div>
          )}

          <div style={{ marginBottom: '28px' }}>
            <Button 
              type={isFavorited ? 'primary' : 'default'}
              icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
              onClick={handleFavorite}
              size="large"
              style={{ 
                marginRight: '12px',
                borderRadius: '8px',
                fontFamily: "'Noto Serif SC', serif",
              }}
            >
              {isFavorited ? '已收藏' : '加入收藏'}
            </Button>
            <Button 
              icon={<EditOutlined />}
              onClick={openReviewModal}
              size="large"
              style={{ 
                borderRadius: '8px',
                fontFamily: "'Noto Serif SC', serif",
              }}
            >
              {myReview ? '编辑评论' : '写评论'}
            </Button>
            {user?.username === 'Huan' && (
              <>
                <Button 
                  icon={<EditOutlined />}
                  size="large"
                  onClick={handleEditAlbum}
                  style={{ 
                    marginLeft: '12px',
                    borderRadius: '8px',
                    fontFamily: "'Noto Serif SC', serif",
                  }}
                >
                  编辑专辑
                </Button>
                <Popconfirm
                  title="删除专辑"
                  description="确定要删除这个专辑吗？此操作无法撤销。"
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                  onConfirm={handleDeleteAlbum}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button 
                    danger
                    icon={<DeleteOutlined />}
                    size="large"
                    style={{ 
                      marginLeft: '12px',
                      borderRadius: '8px',
                      fontFamily: "'Noto Serif SC', serif",
                    }}
                  >
                  删除专辑
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>

          {album.description && (
            <Paragraph style={styles.description}>{album.description}</Paragraph>
          )}
        </Col>
      </Row>

      {/* Track List */}
      {album.tracks && album.tracks.length > 0 && (
        <Card 
          title={<span style={styles.cardTitle}>📀 曲目列表</span>}
          style={{ marginTop: '40px', borderRadius: '16px' }}
        >
          <List
            dataSource={album.tracks}
            renderItem={(track) => (
              <List.Item style={{ padding: '12px 0' }}>
                <span style={styles.trackNumber}>
                  {track.trackNumber}.
                </span>
                <span style={styles.trackTitle}>{track.title}</span>
                {track.formattedDuration && (
                  <span style={styles.trackDuration}>{track.formattedDuration}</span>
                )}
              </List.Item>
            )}
          />
          {album.formattedTotalDuration && (
            <div style={{ 
              textAlign: 'right', 
              marginTop: '16px', 
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '16px',
              color: '#8D6E63',
            }}>
              合计：{album.formattedTotalDuration}
            </div>
          )}
        </Card>
      )}

      {/* Reviews */}
      <Card 
        title={<span style={styles.cardTitle}>💬 评论（{reviews.length}）</span>}
        style={{ marginTop: '32px', borderRadius: '16px' }}
      >
        {reviews.length === 0 ? (
          <div style={styles.emptyText}>
            还没有评论，快来抢沙发！
          </div>
        ) : (
          <List
            dataSource={reviews}
            renderItem={(review) => (
              <div key={review.id}>
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      icon={<MessageOutlined />}
                      onClick={() => toggleReplies(review.id)}
                      style={{ color: '#8D6E63' }}
                    >
                      {expandedReplies[review.id] ? '收起' : '回复'}
                    </Button>,
                    ...(user?.id === review.userId ? [
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
                    ] : [])
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        src={resolveAvatarUrl(review.userAvatar)}
                        size={48}
                        style={{ border: '2px solid #E8D5C4' }}
                      />
                    }
                    title={
                      <div>
                        <span
                          style={{ ...styles.reviewUsername, cursor: 'pointer' }}
                          onClick={() => navigate(`/users/${review.userId}`)}
                        >
                          {review.username}
                        </span>
                        <Rate 
                          disabled 
                          value={review.rating} 
                          allowHalf 
                          style={{ fontSize: '14px', color: '#D4A574' }} 
                        />
                      </div>
                    }
                    description={
                      <div>
                        <p style={styles.reviewContent}>{review.content}</p>
                        <Text type="secondary" style={{ 
                          fontSize: '13px',
                          fontFamily: "'Cormorant Garamond', serif",
                        }}>
                          {new Date(review.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>

                {/* Replies Section */}
                {expandedReplies[review.id] && (
                  <div style={styles.replyContainer}>
                    {/* Reply Input */}
                    {isAuthenticated && (
                      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                        <Input.TextArea
                          value={replyingTo === review.id ? replyContent : ''}
                          onChange={(e) => {
                            setReplyingTo(review.id);
                            setReplyContent(e.target.value);
                          }}
                          placeholder="写下你的回复..."
                          autoSize={{ minRows: 1, maxRows: 3 }}
                          style={{ flex: 1 }}
                          onFocus={() => setReplyingTo(review.id)}
                        />
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          loading={submittingReply && replyingTo === review.id}
                          onClick={() => handleSubmitReply(review.id)}
                          disabled={!replyContent.trim() || replyingTo !== review.id}
                        >
                          回复
                        </Button>
                      </div>
                    )}

                    {/* Replies List */}
                    {reviewReplies[review.id]?.length > 0 ? (
                      reviewReplies[review.id].map((reply) => (
                        <div key={reply.id} style={{ 
                          padding: '8px 0', 
                          borderBottom: '1px solid #E8D5C4',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px',
                        }}>
                          <Avatar 
                            size={32} 
                            src={resolveAvatarUrl(reply.userAvatar)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                style={{ ...styles.replyUsername, cursor: 'pointer' }}
                                onClick={() => navigate(`/users/${reply.userId}`)}
                              >
                                {reply.username}
                              </span>
                              <span style={styles.replyDate}>
                                {new Date(reply.createdAt).toLocaleDateString()}
                              </span>
                              {user?.id === reply.userId && (
                                <Button
                                  type="text"
                                  size="small"
                                  danger
                                  icon={<DeleteOutlined />}
                                  onClick={() => handleDeleteReply(reply.id, review.id)}
                                />
                              )}
                            </div>
                            <p style={styles.replyContent}>{reply.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        暂无回复，快来回复！
                      </Text>
                    )}
                  </div>
                )}
              </div>
            )}
          />
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        title={
          <span style={{ 
            fontFamily: "'Playfair Display', serif",
            fontSize: '20px',
            color: '#5D4037',
          }}>
            {myReview ? '编辑评论' : '写评论'}
          </span>
        }
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
            label={<span style={{ fontFamily: "'Noto Serif SC', serif" }}>评分</span>}
            rules={[{ required: true, message: '请选择评分' }]}
          >
            <Rate allowHalf style={{ fontSize: '28px', color: '#D4A574' }} />
          </Form.Item>
          <Form.Item
            name="content"
            label={<span style={{ fontFamily: "'Noto Serif SC', serif" }}>评论内容</span>}
          >
            <TextArea 
              rows={4} 
              placeholder="写下你的评论..." 
              style={{ fontFamily: "'Noto Serif SC', serif" }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting} 
              block
              size="large"
              style={{ 
                fontFamily: "'Noto Serif SC', serif",
                borderRadius: '8px',
              }}
            >
              {myReview ? '更新评论' : '提交评论'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlbumDetail;
