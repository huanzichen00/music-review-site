import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
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
import { DeleteOutlined, EditOutlined, LinkOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { albumsApi } from '../api/albums';
import { blogPostsApi } from '../api/blogPosts';
import { blogRepliesApi } from '../api/blogReplies';
import { useTheme } from '../context/ThemeContext';
import { resolveAvatarUrl } from '../utils/avatar';
import { unwrapListData } from '../utils/apiData';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Blog = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [repliesByPost, setRepliesByPost] = useState({});
  const [replyInputByPost, setReplyInputByPost] = useState({});
  const [replySubmittingPostId, setReplySubmittingPostId] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const loadRepliesForPosts = useCallback(async (postList) => {
    if (!postList?.length) {
      setRepliesByPost({});
      return;
    }
    const entries = await Promise.all(
      postList.map(async (post) => {
        try {
          const res = await blogRepliesApi.getByPost(post.id);
          return [post.id, res.data || []];
        } catch {
          return [post.id, []];
        }
      })
    );
    setRepliesByPost(Object.fromEntries(entries));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [blogPostsApi.getAll({ page: 0, size: 100 })];
      if (isAuthenticated) {
        requests.push(albumsApi.getAll({ page: 0, size: 500 }));
      }
      const [postsRes, albumsRes] = await Promise.all(requests);
      const postList = unwrapListData(postsRes.data);
      setPosts(postList);
      setAlbums(unwrapListData(albumsRes?.data));
      await loadRepliesForPosts(postList);
    } catch (error) {
      message.error(error.response?.data?.error || '加载博客失败');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loadRepliesForPosts]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    loadData();
  }, [authLoading, loadData]);

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

  const submitReply = async (postId) => {
    if (!isAuthenticated) {
      message.info('请先登录后再回复');
      navigate('/login');
      return;
    }
    const content = (replyInputByPost[postId] || '').trim();
    if (!content) {
      message.warning('请输入回复内容');
      return;
    }
    setReplySubmittingPostId(postId);
    try {
      await blogRepliesApi.create({ blogPostId: postId, content });
      setReplyInputByPost((prev) => ({ ...prev, [postId]: '' }));
      const res = await blogRepliesApi.getByPost(postId);
      setRepliesByPost((prev) => ({ ...prev, [postId]: res.data || [] }));
      message.success('回复已发布');
    } catch (error) {
      message.error(error.response?.data?.error || '回复失败');
    } finally {
      setReplySubmittingPostId(null);
    }
  };

  const deleteReply = async (postId, replyId) => {
    try {
      await blogRepliesApi.delete(replyId);
      const res = await blogRepliesApi.getByPost(postId);
      setRepliesByPost((prev) => ({ ...prev, [postId]: res.data || [] }));
      message.success('回复已删除');
    } catch (error) {
      message.error(error.response?.data?.error || '删除回复失败');
    }
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
      <Space align="center" style={{ marginBottom: 12 }}>
        <Title
          level={2}
          style={{ margin: 0, fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive" }}
        >
          博客广场
        </Title>
        {isAuthenticated ? (
          <Button type="link" onClick={() => navigate('/messages')}>
            去消息中心
          </Button>
        ) : null}
      </Space>

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
                <span>登录后可发布、编辑和删除你自己的文章，也可回复他人博客。</span>
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
              const replies = repliesByPost[post.id] || [];
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
                    title={(
                      <Space wrap>
                        <Text strong style={{ fontSize: 18 }}>{post.title}</Text>
                        <Tag
                          color="geekblue"
                          style={{ cursor: post.userId ? 'pointer' : 'default' }}
                          onClick={() => post.userId && navigate(`/users/${post.userId}`)}
                        >
                          {post.username || `用户 #${post.userId}`}
                        </Tag>
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
                    )}
                    description={(
                      <div>
                        <Text type="secondary">
                          作者：
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: '0 4px' }}
                            onClick={() => post.userId && navigate(`/users/${post.userId}`)}
                          >
                            {post.username || `用户 #${post.userId}`}
                          </Button>
                          · 发布于 {new Date(post.createdAt).toLocaleString()}
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
                            color: isDark ? '#E5E7EB' : '#4E342E',
                          }}
                        >
                          {post.content}
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <Space align="center" style={{ marginBottom: 10 }}>
                            <MessageOutlined />
                            <Text strong>回复（{replies.length}）</Text>
                          </Space>
                          {replies.length > 0 ? (
                            <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
                              {replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: 8,
                                    border: isDark ? '1px solid #2F2F33' : '1px solid #E8D5C4',
                                    background: isDark ? '#171719' : '#FFF8EE',
                                  }}
                                >
                                  <Space align="center" size={8}>
                                    <Avatar
                                      src={resolveAvatarUrl(reply.userAvatar)}
                                      size={26}
                                    />
                                    <Text
                                      strong
                                      style={{ cursor: 'pointer' }}
                                      onClick={() => navigate(`/users/${reply.userId}`)}
                                    >
                                      {reply.username}
                                    </Text>
                                    <Text type="secondary">{new Date(reply.createdAt).toLocaleString()}</Text>
                                    {user?.id === reply.userId ? (
                                      <Button
                                        type="link"
                                        danger
                                        size="small"
                                        onClick={() => deleteReply(post.id, reply.id)}
                                      >
                                        删除
                                      </Button>
                                    ) : null}
                                  </Space>
                                  <div style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{reply.content}</div>
                                </div>
                              ))}
                            </div>
                          ) : null}

                          <Space.Compact style={{ width: '100%' }}>
                            <Input
                              placeholder="写下你的回复..."
                              value={replyInputByPost[post.id] || ''}
                              onChange={(e) =>
                                setReplyInputByPost((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onPressEnter={() => submitReply(post.id)}
                            />
                            <Button
                              type="primary"
                              loading={replySubmittingPostId === post.id}
                              onClick={() => submitReply(post.id)}
                            >
                              回复
                            </Button>
                          </Space.Compact>
                        </div>
                      </div>
                    )}
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
