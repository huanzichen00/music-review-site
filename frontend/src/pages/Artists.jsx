import { useState, useEffect } from 'react';
import {
  Avatar,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { artistsApi } from '../api/artists';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const { Title } = Typography;
const { TextArea } = Input;

const Artists = () => {
  const [form] = Form.useForm();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArtist, setEditingArtist] = useState(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
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

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    setLoading(true);
    try {
      const response = await artistsApi.getAll();
      setArtists(response.data);
    } catch {
      message.error('加载艺术家失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtist = async (artistId) => {
    try {
      await artistsApi.delete(artistId);
      message.success('艺术家删除成功');
      loadArtists();
    } catch (error) {
      message.error(error.response?.data?.error || '删除艺术家失败');
    }
  };

  const canManage = user?.username === 'Huan';

  const openEditModal = (artist) => {
    setEditingArtist(artist);
    form.setFieldsValue({
      name: artist.name,
      country: artist.country ?? undefined,
      formedYear: artist.formedYear ?? undefined,
      genre: artist.genre ?? undefined,
      memberCount: artist.memberCount ?? undefined,
      status: artist.status ?? undefined,
      description: artist.description ?? undefined,
      photoUrl: artist.photoUrl ?? undefined,
    });
  };

  const closeEditModal = () => {
    if (saving) return;
    setEditingArtist(null);
    form.resetFields();
  };

  const handleUpdateArtist = async (values) => {
    if (!editingArtist?.id) return;
    setSaving(true);
    try {
      const payload = {
        name: values.name?.trim(),
        country: values.country?.trim() || null,
        formedYear: values.formedYear ?? null,
        genre: values.genre?.trim() || null,
        memberCount: values.memberCount ?? null,
        status: values.status || null,
        description: values.description?.trim() || null,
        photoUrl: values.photoUrl?.trim() || null,
      };
      await artistsApi.update(editingArtist.id, payload);
      message.success('艺术家更新成功');
      closeEditModal();
      await loadArtists();
    } catch (error) {
      message.error(error.response?.data?.error || '更新艺术家失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Title level={2}>艺术家</Title>
      
      <Card loading={loading}>
        <List
          itemLayout="horizontal"
          dataSource={artists}
          pagination={{
            pageSize: 24,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          renderItem={(artist) => (
            <List.Item
              actions={
                canManage
                  ? [
                      <Button
                        key={`edit-${artist.id}`}
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => openEditModal(artist)}
                      >
                        编辑
                      </Button>,
                      <Popconfirm
                        key={`delete-${artist.id}`}
                        title="删除艺术家"
                        description={
                          artist.albumCount > 0
                            ? `该艺术家下有 ${artist.albumCount} 张专辑，确认仍要删除 "${artist.name}" 吗？`
                            : `确定要删除艺术家 "${artist.name}" 吗？`
                        }
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
                avatar={
                  <Avatar
                    size={52}
                    src={
                      artist.photoUrl ? (
                        <img
                          src={resolveMediaUrl(artist.photoUrl)}
                          alt={artist.name || 'artist'}
                          loading="lazy"
                          decoding="async"
                        />
                      ) : undefined
                    }
                    style={{
                      border: isDark ? '1px solid #2F2F33' : '1px solid #E5B992',
                      backgroundColor: isDark ? '#1F1F22' : '#E8D5C4',
                      color: isDark ? '#D1D5DB' : '#5D4037',
                    }}
                  >
                    {artist.name?.slice(0, 1)?.toUpperCase() || 'A'}
                  </Avatar>
                }
                title={
                  <div>
                    <span style={{ 
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '18px',
                      fontWeight: 600,
                      color: isDark ? '#E5E7EB' : '#4E342E',
                      cursor: 'pointer',
                    }}>
                      <span onClick={() => navigate(`/music/artists/${artist.id}`)}>
                        {artist.name}
                      </span>
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

      <Modal
        title="编辑艺术家"
        open={Boolean(editingArtist)}
        onCancel={closeEditModal}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateArtist}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入艺术家/乐队名' }]}
          >
            <Input maxLength={100} />
          </Form.Item>

          <Form.Item name="country" label="国家/地区">
            <Input maxLength={50} />
          </Form.Item>

          <Form.Item name="formedYear" label="成立年份">
            <InputNumber min={1900} max={2100} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="genre" label="风格">
            <Input maxLength={80} />
          </Form.Item>

          <Form.Item name="memberCount" label="成员人数">
            <InputNumber min={1} max={50} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="status" label="状态">
            <Select
              allowClear
              options={[
                { label: '活跃', value: '活跃' },
                { label: '解散', value: '解散' },
              ]}
            />
          </Form.Item>

          <Form.Item name="photoUrl" label="图片 URL">
            <Input maxLength={255} />
          </Form.Item>

          <Form.Item name="description" label="简介">
            <TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Artists;
