import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  List,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Transfer,
  Typography,
  message,
} from 'antd';
import { DeleteOutlined, LinkOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { artistsApi } from '../api/artists';
import { questionBanksApi } from '../api/questionBanks';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const MIN_ITEMS = 10;
const MAX_ITEMS = 300;

const isPlayableArtist = (artist) =>
  Boolean(
    artist?.name &&
      artist?.country &&
      artist?.formedYear &&
      artist?.genre &&
      artist?.memberCount &&
      artist?.status
  );

const GuessBandBanks = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [banks, setBanks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [targetKeys, setTargetKeys] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [metaForm] = Form.useForm();

  const loadInitial = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [banksRes, artistsRes] = await Promise.all([questionBanksApi.getMine(), artistsApi.getAll()]);
      const mineBanks = banksRes.data || [];
      const playableArtists = (artistsRes.data || []).filter(isPlayableArtist);
      setBanks(mineBanks);
      setArtists(playableArtists);

      if (mineBanks.length > 0) {
        await openBank(mineBanks[0].id, mineBanks);
      } else {
        setSelectedBankId(null);
        setSelectedBank(null);
        setTargetKeys([]);
      }
    } catch {
      message.error('加载题库管理数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const openBank = async (bankId, bankList = banks) => {
    try {
      const detailRes = await questionBanksApi.getMineById(bankId);
      const detail = detailRes.data;
      setSelectedBankId(bankId);
      setSelectedBank(detail);
      setTargetKeys((detail.artists || []).map((artist) => String(artist.id)));
      metaForm.setFieldsValue({
        name: detail.name,
        visibility: detail.visibility || 'PUBLIC',
      });

      const maybeUpdated = bankList.map((bank) => (bank.id === bankId ? { ...bank, ...detail } : bank));
      setBanks(maybeUpdated);
    } catch {
      message.error('加载题库详情失败');
    }
  };

  const transferDataSource = useMemo(
    () =>
      artists.map((artist) => ({
        key: String(artist.id),
        title: artist.name,
        description: `${artist.country} | ${artist.genre} | ${artist.formedYear} | ${artist.memberCount}人 | ${artist.status}`,
      })),
    [artists]
  );

  const selectedCount = targetKeys.length;
  const countValid = selectedCount >= MIN_ITEMS && selectedCount <= MAX_ITEMS;

  const refreshBanks = async (preferId = selectedBankId) => {
    const banksRes = await questionBanksApi.getMine();
    const mineBanks = banksRes.data || [];
    setBanks(mineBanks);
    if (!mineBanks.length) {
      setSelectedBankId(null);
      setSelectedBank(null);
      setTargetKeys([]);
      return;
    }

    const targetId = mineBanks.some((bank) => bank.id === preferId) ? preferId : mineBanks[0].id;
    await openBank(targetId, mineBanks);
  };

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      const createRes = await questionBanksApi.create({
        name: values.name.trim(),
        visibility: values.visibility,
      });
      const createdBankId = createRes?.data?.id;
      setCreateOpen(false);
      createForm.resetFields();
      await refreshBanks(createdBankId);
      message.success('题库创建成功');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || '创建题库失败');
    }
  };

  const handleSaveMeta = async () => {
    if (!selectedBankId) return;
    try {
      const values = await metaForm.validateFields();
      setSavingMeta(true);
      await questionBanksApi.update(selectedBankId, {
        name: values.name.trim(),
        visibility: values.visibility,
      });
      await refreshBanks(selectedBankId);
      message.success('题库信息已更新');
    } catch (error) {
      if (error?.errorFields) return;
      message.error(error?.response?.data?.error || '更新题库信息失败');
    } finally {
      setSavingMeta(false);
    }
  };

  const handleSaveItems = async () => {
    if (!selectedBankId) return;
    if (!countValid) {
      message.warning(`题库题目数量需在 ${MIN_ITEMS}-${MAX_ITEMS} 之间`);
      return;
    }

    try {
      setSavingItems(true);
      await questionBanksApi.updateItems(selectedBankId, {
        artistIds: targetKeys.map((key) => Number(key)),
      });
      await refreshBanks(selectedBankId);
      message.success('题库题目已保存');
    } catch (error) {
      message.error(error?.response?.data?.error || '保存题目失败');
    } finally {
      setSavingItems(false);
    }
  };

  const handleDelete = () => {
    if (!selectedBankId) return;

    Modal.confirm({
      title: '确认删除该题库？',
      content: '删除后无法恢复。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await questionBanksApi.remove(selectedBankId);
          await refreshBanks();
          message.success('题库已删除');
        } catch (error) {
          message.error(error?.response?.data?.error || '删除题库失败');
        }
      },
    });
  };

  const handleCopyShareLink = async () => {
    if (!selectedBank?.shareToken) {
      message.warning('当前题库暂无分享链接');
      return;
    }
    const shareUrl = `${window.location.origin}/music/guess-band?share=${selectedBank.shareToken}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      message.success('分享链接已复制');
    } catch {
      message.info(`分享链接：${shareUrl}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <Alert
          type="info"
          showIcon
          message="题库管理需要登录"
          description="请先登录后创建、编辑和分享你的自选题库。"
        />
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Title level={2} style={{ marginBottom: 0 }}>猜乐队题库管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建题库
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 16, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <Card style={{ width: 320, flex: '1 1 320px' }} title="我的题库">
          {banks.length === 0 ? (
            <Text type="secondary">还没有题库，先新建一个。</Text>
          ) : (
            <List
              dataSource={banks}
              renderItem={(bank) => (
                <List.Item
                  style={{ cursor: 'pointer', paddingInline: 8, borderRadius: 8, background: selectedBankId === bank.id ? '#f6ffed' : undefined }}
                  onClick={() => openBank(bank.id)}
                >
                  <List.Item.Meta
                    title={bank.name}
                    description={
                      <Space size={8} wrap>
                        <Tag color={bank.visibility === 'PRIVATE' ? 'default' : 'success'}>{bank.visibility}</Tag>
                        <Text type="secondary">{bank.itemCount || 0} 题</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>

        <Card
          style={{ flex: '3 1 860px' }}
          title="题库详情"
          extra={
            <Button
              type="primary"
              onClick={() => navigate('/music/guess-band')}
              style={{
                border: 'none',
                color: '#FDF5ED',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #FFB300 0%, #2E7BE6 100%)',
                boxShadow: '0 4px 12px rgba(229, 57, 53, 0.32)',
              }}
            >
              返回猜乐队
            </Button>
          }
        >
          {!selectedBank ? (
            <Alert type="warning" showIcon message="请选择一个题库" />
          ) : (
            <>
              <Form layout="inline" form={metaForm} style={{ rowGap: 12 }}>
                <Form.Item
                  name="name"
                  label="名称"
                  rules={[
                    { required: true, message: '请输入题库名' },
                    { max: 100, message: '最多 100 字' },
                  ]}
                >
                  <Input style={{ width: 240 }} />
                </Form.Item>
                <Form.Item name="visibility" label="可见性" initialValue="PUBLIC">
                  <Select
                    style={{ width: 140 }}
                    options={[
                      { value: 'PUBLIC', label: 'PUBLIC' },
                      { value: 'PRIVATE', label: 'PRIVATE' },
                    ]}
                  />
                </Form.Item>
                <Form.Item>
                  <Button icon={<SaveOutlined />} onClick={handleSaveMeta} loading={savingMeta}>保存信息</Button>
                </Form.Item>
                <Form.Item>
                  <Button icon={<LinkOutlined />} onClick={handleCopyShareLink}>复制分享链接</Button>
                </Form.Item>
                <Form.Item>
                  <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除题库</Button>
                </Form.Item>
              </Form>

              <div style={{ marginTop: 14 }}>
                <Space wrap>
                  <Tag color={countValid ? 'success' : 'error'}>
                    已选 {selectedCount} / 需 {MIN_ITEMS}-{MAX_ITEMS}
                  </Tag>
                  <Text type="secondary">只展示字段完整、可用于猜乐队的乐队。</Text>
                </Space>
              </div>

              <div style={{ marginTop: 14 }}>
                <Transfer
                  dataSource={transferDataSource}
                  titles={['可选乐队', '题库乐队']}
                  targetKeys={targetKeys}
                  onChange={setTargetKeys}
                  render={(item) => `${item.title} · ${item.description}`}
                  showSearch
                  filterOption={(inputValue, item) =>
                    item.title.toLowerCase().includes(inputValue.toLowerCase()) ||
                    item.description.toLowerCase().includes(inputValue.toLowerCase())
                  }
                  listStyle={{ width: 360, height: 520 }}
                  oneWay
                />
              </div>

              <div style={{ marginTop: 12 }}>
                <Button type="primary" icon={<SaveOutlined />} onClick={handleSaveItems} loading={savingItems}>
                  保存题目
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal
        title="新建题库"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="创建"
      >
        <Form layout="vertical" form={createForm} initialValues={{ visibility: 'PUBLIC' }}>
          <Form.Item
            name="name"
            label="题库名"
            rules={[
              { required: true, message: '请输入题库名' },
              { max: 100, message: '最多 100 字' },
            ]}
          >
            <Input placeholder="例如：90s Britpop" />
          </Form.Item>
          <Form.Item name="visibility" label="可见性">
            <Select
              options={[
                { value: 'PUBLIC', label: 'PUBLIC（可分享）' },
                { value: 'PRIVATE', label: 'PRIVATE（仅自己）' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GuessBandBanks;
