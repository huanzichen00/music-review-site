import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Table,
  Typography,
} from 'antd';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { artistsApi } from '../api/artists';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { isRequestCanceled } from '../utils/http';

const { Title } = Typography;
const { TextArea } = Input;

const Artists = () => {
  const [form] = Form.useForm();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArtist, setEditingArtist] = useState(null);
  const [saving, setSaving] = useState(false);
  const [nameKeyword, setNameKeyword] = useState('');
  const [genreKeyword, setGenreKeyword] = useState(undefined);
  const [countryKeyword, setCountryKeyword] = useState(undefined);
  const [formedYearKeyword, setFormedYearKeyword] = useState(undefined);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();

  const loadArtists = async (signal) => {
    setLoading(true);
    try {
      const response = await artistsApi.getAll({ signal });
      setArtists(response.data);
    } catch (error) {
      if (isRequestCanceled(error)) {
        return;
      }
      message.error('加载艺术家失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadArtists(controller.signal);
    return () => controller.abort();
  }, []);

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

  const countryOptions = useMemo(
    () =>
      Array.from(new Set((artists || []).map((artist) => artist.country).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((country) => ({ value: country, label: country })),
    [artists]
  );
  const genreOptions = useMemo(
    () =>
      Array.from(new Set((artists || []).map((artist) => artist.genre).filter(Boolean)))
        .sort((a, b) => a.localeCompare(b))
        .map((genre) => ({ value: genre, label: genre })),
    [artists]
  );
  const formedYearOptions = useMemo(
    () =>
      Array.from(new Set((artists || []).map((artist) => artist.formedYear).filter(Boolean)))
        .sort((a, b) => b - a)
        .map((year) => ({ value: year, label: String(year) })),
    [artists]
  );

  const filteredArtists = useMemo(() => {
    const name = nameKeyword.trim().toLowerCase();
    return (artists || []).filter((artist) => {
      const matchesName = !name || String(artist.name || '').toLowerCase().includes(name);
      const matchesGenre = !genreKeyword || artist.genre === genreKeyword;
      const matchesCountry = !countryKeyword || artist.country === countryKeyword;
      const matchesYear = !formedYearKeyword || artist.formedYear === formedYearKeyword;
      return matchesName && matchesGenre && matchesCountry && matchesYear;
    });
  }, [artists, countryKeyword, formedYearKeyword, genreKeyword, nameKeyword]);

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

  const columns = [
    {
      title: 'NAME',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => String(a.name || '').localeCompare(String(b.name || '')),
      render: (_, artist) => (
        <span
          onClick={() => navigate(`/music/artists/${artist.id}`)}
          style={{
            cursor: 'pointer',
            fontWeight: 700,
            color: isDark ? '#E5E7EB' : '#4E342E',
            letterSpacing: '0.2px',
          }}
        >
          {artist.name}
        </span>
      ),
    },
    {
      title: 'REGION',
      dataIndex: 'country',
      key: 'country',
      width: 130,
      render: (value) => value || '-',
    },
    {
      title: '简介',
      dataIndex: 'description',
      key: 'description',
      width: 260,
      ellipsis: true,
      render: (value) => value || '-',
    },
    {
      title: 'GENRE',
      dataIndex: 'genre',
      key: 'genre',
      width: 180,
      render: (value) => value || '-',
    },
    {
      title: 'FORMED',
      dataIndex: 'formedYear',
      key: 'formedYear',
      width: 110,
      sorter: (a, b) => (a.formedYear || 0) - (b.formedYear || 0),
      render: (value) => value || '-',
    },
    {
      title: '人数',
      dataIndex: 'memberCount',
      key: 'memberCount',
      width: 100,
      sorter: (a, b) => (a.memberCount || 0) - (b.memberCount || 0),
      render: (value) => value || '-',
    },
    {
      title: 'ALBUMS',
      dataIndex: 'albumCount',
      key: 'albumCount',
      width: 110,
      sorter: (a, b) => (a.albumCount || 0) - (b.albumCount || 0),
      render: (value) => value || 0,
    },
    {
      title: 'STATUS',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (value) => value || '-',
    },
  ];
  if (canManage) {
    columns.push({
      title: 'ACTIONS',
      key: 'actions',
      width: 180,
      render: (_, artist) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            key={`edit-${artist.id}`}
            icon={<EditOutlined />}
            size="small"
            onClick={() => openEditModal(artist)}
          >
            编辑
          </Button>
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
            <Button danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </div>
      ),
    });
  }

  return (
    <div>
      <Title level={2}>
        浏览乐队
        <span
          style={{
            marginLeft: 8,
            fontSize: 14,
            fontWeight: 400,
            color: isDark ? '#9CA3AF' : '#6B7280',
          }}
        >
          （点击乐队名可查看详细信息）
        </span>
      </Title>
      
      <Card loading={loading}>
        <Row className="artists-filters" gutter={[12, 12]} style={{ marginBottom: 14 }}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input
              allowClear
              placeholder="搜索名称"
              value={nameKeyword}
              onChange={(e) => setNameKeyword(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              allowClear
              showSearch
              placeholder="按风格筛选"
              optionFilterProp="label"
              value={genreKeyword}
              options={genreOptions}
              onChange={setGenreKeyword}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              allowClear
              showSearch
              placeholder="按地区筛选"
              optionFilterProp="label"
              value={countryKeyword}
              options={countryOptions}
              onChange={setCountryKeyword}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              allowClear
              showSearch
              placeholder="按成立年份筛选"
              optionFilterProp="label"
              value={formedYearKeyword}
              options={formedYearOptions}
              onChange={setFormedYearKeyword}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredArtists}
          pagination={{
            pageSize: 30,
            showSizeChanger: false,
            hideOnSinglePage: true,
            position: ['bottomCenter'],
          }}
          size="middle"
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
