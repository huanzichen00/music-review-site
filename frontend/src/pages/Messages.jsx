import { useCallback, useEffect, useState } from 'react';
import { Alert, Badge, Button, Card, Empty, Form, Input, List, Space, Spin, Tag, Typography, message } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../api/notifications';
import { useAuth } from '../context/AuthContext';
import { unwrapListData } from '../utils/apiData';
import { formatChinaDateTime } from '../utils/datetime';

const { Title, Text } = Typography;
const { TextArea } = Input;

const Messages = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const isHuan = user?.username === 'Huan';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getMine({ page: 0, size: 200 });
      const list = unwrapListData(res.data);
      setNotifications(list);
      if (list.some((item) => !item.isRead)) {
        try {
          await notificationsApi.markAllRead();
          setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
          window.dispatchEvent(new Event('notifications-updated'));
        } catch {
          // keep list readable even if auto mark read fails
        }
      }
    } catch (error) {
      message.error(error.response?.data?.error || '加载消息失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadData();
  }, [authLoading, isAuthenticated, loadData, navigate]);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleAnnouncement = async (values) => {
    setSaving(true);
    try {
      await notificationsApi.createAnnouncement({
        title: values.title?.trim(),
        content: values.content?.trim(),
      });
      form.resetFields();
      message.success('公告已发布');
    } catch (error) {
      message.error(error.response?.data?.error || '发布公告失败');
    } finally {
      setSaving(false);
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
      <Space align="center" style={{ marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>消息中心</Title>
        <Badge count={unreadCount} overflowCount={99}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </Space>

      {isHuan ? (
        <Card title="发布公告" style={{ marginBottom: 16 }}>
          <Form form={form} layout="vertical" onFinish={handleAnnouncement}>
            <Form.Item
              name="title"
              label="公告标题"
              rules={[{ required: true, message: '请输入公告标题' }]}
            >
              <Input maxLength={200} />
            </Form.Item>
            <Form.Item
              name="content"
              label="公告内容"
              rules={[{ required: true, message: '请输入公告内容' }]}
            >
              <TextArea rows={4} maxLength={2000} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={saving}>
              发布公告
            </Button>
          </Form>
        </Card>
      ) : null}

      <Card
        title="我的消息"
      >
        {notifications.length === 0 ? (
          <Empty description="暂无消息" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={(
                    <Space wrap>
                      <Text strong>{item.title}</Text>
                      <Tag color={item.type === 'ANNOUNCEMENT' ? 'gold' : 'geekblue'}>
                        {item.type === 'ANNOUNCEMENT' ? '公告' : '回复'}
                      </Tag>
                      {!item.isRead ? <Tag color="red">未读</Tag> : <Tag>已读</Tag>}
                    </Space>
                  )}
                  description={(
                    <div>
                      <Text style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Text>
                      <div style={{ marginTop: 6 }}>
                        <Text type="secondary">
                          {item.senderUsername ? `来自 ${item.senderUsername} · ` : ''}
                          {formatChinaDateTime(item.createdAt)}
                        </Text>
                      </div>
                      {item.relatedBlogPostId ? (
                        <div style={{ marginTop: 8 }}>
                          <Alert
                            type="info"
                            showIcon
                            message="相关博客"
                            description={(
                              <Button type="link" onClick={() => navigate('/blog')} style={{ paddingLeft: 0 }}>
                                前往博客广场查看
                              </Button>
                            )}
                          />
                        </div>
                      ) : null}
                    </div>
                  )}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default Messages;
