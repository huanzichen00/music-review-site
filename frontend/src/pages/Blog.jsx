import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  message,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { albumsApi } from '../api/albums';
import { blogPostsApi } from '../api/blogPosts';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Blog = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated]);

  const loadData = async () => {
    setLoading(true);
    try {
      const requests = [blogPostsApi.getAll()];
      if (isAuthenticated) {
        requests.push(albumsApi.getAll());
      }
      const [postsRes, albumsRes] = await Promise.all(requests);
      setPosts(postsRes.data || []);
      setAlbums(albumsRes?.data || []);
    } catch (error) {
      message.error(error.response?.data?.error || '加载博客失败');
    } finally {
      setLoading(false);
    }
  };

  const resetEditor = () => {
    setEditingPostId(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    setSaving(true);
    try {
      const payload = {
        title: values.title?.trim(),
        content: values.content?.trim(),
        albumId: values.albumId || null,
      };
      if (editingPostId) {
        await blogPostsApi.update(editingPostId, payload);
        message.success('博客文章已更新');
      } else {
        await blogPostsApi.create(payload);
        message.success('博客文章已发布');
      }
      resetEditor();
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '保存博客失败');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    form.setFieldsValue({
      title: post.title,
      content: post.content,
      albumId: post.albumId || undefined,
    });
  };

  const handleDelete = async (postId) => {
    try {
      await blogPostsApi.delete(postId);
      message.success('文章已删除');
      if (editingPostId === postId) {
        resetEditor();
      }
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.error || '删除失败');
    }
  };

  const resolveMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('/api') || url.startsWith('/')) {
      return new URL(url, window.location.origin).toString();
    }
    return url;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <Title
        level={2}
        style={{ fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive" }}
      >
        博客广场
      </Title>

      {isAuthenticated ? (
        <Card style={{ marginBottom: 24 }}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="title"
              label="文章标题"
              rules={[{ required: true, message: '请输入标题' }]}
            >
              <Input placeholder="写一个标题..." maxLength={200} />
            </Form.Item>

            <Form.Item name="albumId" label="关联专辑（可选）">
              <Select
                allowClear
                showSearch
                placeholder="选择一个专辑，读者可直接跳转"
                optionFilterProp="label"
                options={albums.map((album) => ({
                  value: album.id,
                  label: `${album.title}${album.artistName ? ` - ${album.artistName}` : ''}`,
                }))}
              />
            </Form.Item>

            <Form.Item
              name="content"
              label="文章内容"
              rules={[{ required: true, message: '请输入内容' }]}
            >
              <TextArea rows={8} placeholder="分享你对音乐、专辑或风格的想法..." />
            </Form.Item>

            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {editingPostId ? '更新文章' : '发布文章'}
              </Button>
              {editingPostId && (
                <Button onClick={resetEditor}>
                  取消编辑
                </Button>
              )}
            </Space>
          </Form>
        </Card>
      ) : (
        <Card style={{ marginBottom: 24 }}>
          <Alert
            type="info"
            showIcon
            message="所有文章均可公开查看"
            description={(
              <Space>
                <span>登录后可发布、编辑和删除你自己的文章。</span>
                <Button type="link" onClick={() => navigate('/login')}>去登录</Button>
              </Space>
            )}
          />
        </Card>
      )}

      <Card title="已发布文章（所有人可见）">
        {posts.length === 0 ? (
          <Empty description="还没有博客文章，写第一篇吧" />
        ) : (
          <List
            dataSource={posts}
            renderItem={(post) => {
              const isOwner = isAuthenticated && user?.id === post.userId;
              return (
              <List.Item
                actions={isOwner ? [
                  <Button
                    key={`edit-${post.id}`}
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => startEdit(post)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key={`delete-${post.id}`}
                    title="确认删除这篇文章？"
                    onConfirm={() => handleDelete(post.id)}
                    okText="删除"
                    cancelText="取消"
                  >
                    <Button danger type="link" icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                ] : []}
              >
                <List.Item.Meta
                  title={
                    <Space wrap>
                      <Text strong style={{ fontSize: 18 }}>{post.title}</Text>
                      <Tag color="geekblue">{post.username || `用户 #${post.userId}`}</Tag>
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
                    <div>
                      <Text type="secondary">
                        作者：{post.username || `用户 #${post.userId}`} · 发布于 {new Date(post.createdAt).toLocaleString()}
                      </Text>
                      {post.albumCoverUrl && (
                        <div style={{ marginTop: 10 }}>
                          <img
                            src={resolveMediaUrl(post.albumCoverUrl)}
                            alt={post.albumTitle || 'album cover'}
                            style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid #E8D5C4' }}
                            onClick={() => post.albumId && navigate(`/music/albums/${post.albumId}`)}
                          />
                        </div>
                      )}
                      <div
                        style={{
                          marginTop: 12,
                          whiteSpace: 'pre-wrap',
                          lineHeight: 1.7,
                          color: '#4E342E',
                        }}
                      >
                        {post.content}
                      </div>
                    </div>
                  }
                />
              </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default Blog;
