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
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      message.info('Please login first');
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated]);

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
      message.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    // Validate file type
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Only image files are allowed!');
      return false;
    }

    // Validate file size (max 5MB)
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    setUploading(true);
    try {
      const response = await usersApi.uploadAvatar(file);
      const newAvatarUrl = response.data.url;
      setAvatarUrl(newAvatarUrl);
      message.success('Avatar uploaded successfully!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to upload avatar');
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
      message.success('Profile updated successfully!');
    } catch (error) {
      message.error(error.response?.data?.error || 'Failed to update profile');
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
      <div style={{ marginTop: 8 }}>Upload</div>
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
      <Title level={2}>My Profile</Title>

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
                    src={avatarUrl.startsWith('/api') ? `http://localhost:8080${avatarUrl}` : avatarUrl}
                    icon={<UserOutlined />}
                  />
                ) : (
                  uploadButton
                )}
              </Upload>
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', fontSize: 12 }}>
                Click to upload
              </Text>
            </div>
          ) : (
            <Avatar 
              size={120} 
              src={profile?.avatarUrl?.startsWith('/api') ? `http://localhost:8080${profile.avatarUrl}` : profile?.avatarUrl}
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
                  <Statistic title="Reviews" value={profile?.reviewCount || 0} />
                </Col>
                <Col>
                  <Statistic title="Favorites" value={profile?.favoriteCount || 0} />
                </Col>
              </Row>
            </div>
          </div>
          {!editing && (
            <Button 
              icon={<EditOutlined />} 
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>

        <Divider />

        {/* Bio Display (when not editing) */}
        {!editing && (
          <div>
            <Title level={5}>About</Title>
            {profile?.bio ? (
              <Paragraph>{profile.bio}</Paragraph>
            ) : (
              <Text type="secondary" italic>No bio yet. Click "Edit Profile" to add one.</Text>
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
              label="Bio"
              extra="Tell others about yourself (max 500 characters)"
              rules={[
                { max: 500, message: 'Bio must be less than 500 characters' }
              ]}
            >
              <TextArea 
                rows={4} 
                placeholder="Write something about yourself..."
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
                Save Changes
              </Button>
              <Button onClick={handleCancel}>
                Cancel
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider />

        {/* Account Info */}
        <Descriptions title="Account Information" column={1}>
          <Descriptions.Item label="Username">{profile?.username}</Descriptions.Item>
          <Descriptions.Item label="Email">{profile?.email}</Descriptions.Item>
          <Descriptions.Item label="Role">{profile?.role}</Descriptions.Item>
          <Descriptions.Item label="Member Since">
            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Profile;
