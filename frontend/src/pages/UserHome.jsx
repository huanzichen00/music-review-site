import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Avatar,
  Button,
  Card,
  Divider,
  Empty,
  List,
  Row,
  Col,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import { LinkOutlined, UserOutlined } from '@ant-design/icons';
import { usersApi } from '../api/users';
import { blogPostsApi } from '../api/blogPosts';
import SmartAlbumCover from '../components/SmartAlbumCover';
import { resolveAvatarUrl } from '../utils/avatar';
import { unwrapListData } from '../utils/apiData';

const { Title, Text, Paragraph } = Typography;

const UserHome = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const loadUserHome = async () => {
      setLoading(true);
      try {
        const [profileRes, postsRes] = await Promise.all([
          usersApi.getUserProfile(id),
          blogPostsApi.getByUser(id, { page: 0, size: 100 }),
        ]);
        setProfile(profileRes.data);
        setPosts(unwrapListData(postsRes.data));
      } catch {
        message.error('用户主页不存在或加载失败');
        navigate('/music/home');
      } finally {
        setLoading(false);
      }
    };

    loadUserHome();
  }, [id, navigate]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
          <Avatar
            size={120}
            src={resolveAvatarUrl(profile?.avatarUrl)}
            icon={<UserOutlined />}
            style={{ border: '2px solid #E8D5C4' }}
          />
          <div style={{ flex: 1, minWidth: 260 }}>
            <Title level={2} style={{ marginBottom: 8 }}>
              {profile?.username} 的主页
            </Title>
            <Space size={24} wrap>
              <Statistic title="评论" value={profile?.reviewCount || 0} />
              <Statistic title="收藏" value={profile?.favoriteCount || 0} />
            </Space>
            <Divider style={{ margin: '14px 0' }} />
            {profile?.bio ? (
              <Paragraph style={{ marginBottom: 8 }}>{profile.bio}</Paragraph>
            ) : (
              <Text type="secondary">这个用户还没有填写简介。</Text>
            )}
            <div style={{ marginTop: 10 }}>
              <Text type="secondary">
                加入时间：{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
              </Text>
            </div>
          </div>
        </div>
      </Card>

      <Card title="TA 发布的博客" style={{ marginTop: 20 }}>
        {posts.length === 0 ? (
          <Empty description="暂时还没有发布博客" />
        ) : (
          <List
            dataSource={posts}
            renderItem={(post) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Text strong>{post.title}</Text>
                      {post.albumId && (
                        <Tag
                          color="gold"
                          style={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/music/albums/${post.albumId}`)}
                        >
                          <LinkOutlined /> {post.albumTitle || `专辑 #${post.albumId}`}
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <>
                      <Text type="secondary">
                        发布于 {new Date(post.createdAt).toLocaleString()}
                      </Text>
                      {post.albumCoverUrl && (
                        <div style={{ marginTop: 8 }}>
                          <SmartAlbumCover
                            albumId={post.albumId}
                            coverUrl={post.albumCoverUrl}
                            alt={post.albumTitle || 'album cover'}
                            variant="thumb"
                            width={52}
                            height={52}
                            style={{
                              width: 52,
                              height: 52,
                              borderRadius: 8,
                              objectFit: 'cover',
                              border: '1px solid #E8D5C4',
                              cursor: post.albumId ? 'pointer' : 'default',
                            }}
                            onClick={() => post.albumId && navigate(`/music/albums/${post.albumId}`)}
                          />
                        </div>
                      )}
                      <div style={{ marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                        {post.content}
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Row justify="center" style={{ marginTop: 16 }}>
        <Col>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </Col>
      </Row>
    </div>
  );
};

export default UserHome;
