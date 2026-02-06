import { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Typography, message, Avatar, 
  Spin, Descriptions, Statistic, Row, Col, Divider, Upload
} from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined, UploadOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../api/users';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const Profile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      message.info('请先登录');
      navigate('/login');
      return;
    }
    loadProfile();
  }, [authLoading, isAuthenticated]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await usersApi.getMyProfile();
      setProfile(response.data);
      setAvatarUrl(response.data.avatarUrl || '');
      form.setFieldsValue({
        bio: response.data.bio || '',
      });
    } catch (error) {
      message.error('加载个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    // Validate file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('仅支持图片文件！');
      return false;
    }

    // Validate file size (max 5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('图片需小于 5MB！');
      return false;
    }

    setUploading(true);
    try {
      const response = await usersApi.uploadAvatar(file);
      const newAvatarUrl = response.data.url;
      setAvatarUrl(newAvatarUrl);
      message.success('头像上传成功！');
    } catch (error) {
      message.error(error.response?.data?.error || '上传头像失败');
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const response = await usersApi.updateMyProfile({
        avatarUrl: avatarUrl,
        bio: values.bio,
      });
      setProfile(response.data);
      setEditing(false);
      message.success('个人资料更新成功！');
    } catch (error) {
      message.error(error.response?.data?.error || '更新个人资料失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setAvatarUrl(profile?.avatarUrl || '');
    form.setFieldsValue({
      bio: profile?.bio || '',
    });
    setEditing(false);
  };

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>我的资料</Title>

      <Card>
        {/* Avatar and Basic Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24 }}>
          {editing ? (
            <div style={{ marginRight: 24 }}>
              <Upload
                name="avatar"
                listType="picture-card"
                showUploadList={false}
                beforeUpload={handleUpload}
                accept="image/*"
              >
                {avatarUrl ? (
                  <Avatar 
                    size={100} 
                    src={avatarUrl?.startsWith('/api') ? new URL(avatarUrl, window.location.origin).toString() : avatarUrl}
                    icon={<UserOutlined />}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12 }}>
                点击上传
              </Text>
            </div>
          ) : (
            <Avatar 
              size={120} 
              src={profile?.avatarUrl?.startsWith('/api') ? new URL(profile.avatarUrl, window.location.origin).toString() : profile?.avatarUrl}
              icon={<UserOutlined />}
              style={{ marginRight: 24, flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ marginBottom: 8 }}>{profile?.username}</Title>
            <Text type="secondary">{profile?.email}</Text>
            <div style={{ marginTop: 16 }}>
              <Row gutter={24}>
                <Col>
                  <Statistic title="评论" value={profile?.reviewCount || 0} />
                </Col>
                <Col>
                  <Statistic title="收藏" value={profile?.favoriteCount || 0} />
                </Col>
              </Row>
            </div>
          </div>
          {!editing && (
            <Button 
              icon={<EditOutlined />} 
              onClick={() => setEditing(true)}
            >
              编辑资料
            </Button>
          )}
        </div>

        <Divider />

        {/* Bio Display (when not editing) */}
        {!editing && (
          <div>
            <Title level={5}>简介</Title>
            {profile?.bio ? (
              <Paragraph>{profile.bio}</Paragraph>
            ) : (
              <Text type="secondary" italic>暂无简介，点击“编辑资料”添加。</Text>
            )}
          </div>
        )}

        {/* Edit Form */}
        {editing && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item
              name="bio"
              label="个人简介"
              extra="介绍一下你自己（最多 500 字）"
              rules={[
                { max: 500, message: '个人简介最多 500 字' }
              ]}
            >
              <TextArea 
                rows={4} 
                placeholder="写点关于你的介绍..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={saving}
                icon={<SaveOutlined />}
                style={{ marginRight: 8 }}
              >
                保存修改
              </Button>
              <Button onClick={handleCancel}>
                取消
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider />

        {/* Account Info */}
        <Descriptions title="账号信息" column={1}>
          <Descriptions.Item label="用户名">{profile?.username}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{profile?.email}</Descriptions.Item>
          <Descriptions.Item label="角色">{profile?.role}</Descriptions.Item>
          <Descriptions.Item label="注册时间">
            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Profile;
