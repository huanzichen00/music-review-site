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
import { useTheme } from '../context/ThemeContext';

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
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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
  const [publicBanks, setPublicBanks] = useState([]);
  const [selectedPublicBankId, setSelectedPublicBankId] = useState(null);
  const [selectedPublicBank, setSelectedPublicBank] = useState(null);
  const [publicDetailLoading, setPublicDetailLoading] = useState(false);
  const [publicSearch, setPublicSearch] = useState('');

  const loadInitial = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [banksRes, artistsRes, publicBanksRes] = await Promise.all([
        questionBanksApi.getMine(),
        artistsApi.getAll(),
        questionBanksApi.getPublic(),
      ]);
      const mineBanks = banksRes.data || [];
      const playableArtists = (artistsRes.data || []).filter(isPlayableArtist);
      const allPublicBanks = publicBanksRes.data || [];
      const hallBanks = allPublicBanks.filter((bank) => {
        if (user?.id != null && bank.ownerUserId != null) {
          return bank.ownerUserId !== user.id;
        }
        if (user?.username && bank.ownerUsername) {
          return bank.ownerUsername !== user.username;
        }
        return true;
      });
      setBanks(mineBanks);
      setArtists(playableArtists);
      setPublicBanks(hallBanks);

      if (mineBanks.length > 0) {
        await openBank(mineBanks[0].id, mineBanks);
      } else {
        setSelectedBankId(null);
        setSelectedBank(null);
        setTargetKeys([]);
      }

      if (hallBanks.length > 0) {
        await openPublicBank(hallBanks[0].id, hallBanks);
      } else {
        setSelectedPublicBankId(null);
        setSelectedPublicBank(null);
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
  }, [isAuthenticated, user?.id, user?.username]);

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

  const openPublicBank = async (bankId, bankList = publicBanks) => {
    try {
      setPublicDetailLoading(true);
      const detailRes = await questionBanksApi.getPublicById(bankId);
      const detail = detailRes.data;
      setSelectedPublicBankId(bankId);
      setSelectedPublicBank(detail);
      const maybeUpdated = bankList.map((bank) => (bank.id === bankId ? { ...bank, ...detail } : bank));
      setPublicBanks(maybeUpdated);
    } catch {
      message.error('加载公开题库详情失败');
    } finally {
      setPublicDetailLoading(false);
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
  const filteredPublicBanks = useMemo(() => {
    const keyword = publicSearch.trim().toLowerCase();
    if (!keyword) {
      return publicBanks;
    }
    return publicBanks.filter((bank) => {
      const name = (bank.name || '').toLowerCase();
      const owner = (bank.ownerUsername || '').toLowerCase();
      return name.includes(keyword) || owner.includes(keyword);
    });
  }, [publicBanks, publicSearch]);

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

  const refreshPublicBanks = async (preferId = selectedPublicBankId) => {
    const publicBanksRes = await questionBanksApi.getPublic();
    const allPublicBanks = publicBanksRes.data || [];
    const hallBanks = allPublicBanks.filter((bank) => {
      if (user?.id != null && bank.ownerUserId != null) {
        return bank.ownerUserId !== user.id;
      }
      if (user?.username && bank.ownerUsername) {
        return bank.ownerUsername !== user.username;
      }
      return true;
    });
    setPublicBanks(hallBanks);
    if (!hallBanks.length) {
      setSelectedPublicBankId(null);
      setSelectedPublicBank(null);
      return;
    }
    const targetId = hallBanks.some((bank) => bank.id === preferId) ? preferId : hallBanks[0].id;
    await openPublicBank(targetId, hallBanks);
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
      await refreshPublicBanks();
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
      await refreshPublicBanks();
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
          await refreshPublicBanks();
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

  const handleCopyPublicShareLink = async (bank) => {
    if (!bank?.shareToken) {
      message.warning('该公开题库暂无分享链接');
      return;
    }
    const shareUrl = `${window.location.origin}/music/guess-band?share=${bank.shareToken}`;
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
        <Card
          style={{
            width: 320,
            flex: '1 1 320px',
            ...(isDark
              ? { background: 'linear-gradient(145deg, #171719 0%, #131316 100%)', border: '1px solid #2F2F33' }
              : {}),
          }}
          title="我的题库"
        >
          {banks.length === 0 ? (
            <Text type="secondary">还没有题库，先新建一个。</Text>
          ) : (
            <List
              dataSource={banks}
              renderItem={(bank) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    paddingInline: 8,
                    borderRadius: 8,
                    background: selectedBankId === bank.id ? (isDark ? '#232327' : '#f6ffed') : undefined,
                  }}
                  onClick={() => openBank(bank.id)}
                >
                  <List.Item.Meta
                    title={bank.name}
                    description={
                      <Space size={8} wrap>
                        <Tag color={isDark ? 'default' : bank.visibility === 'PRIVATE' ? 'default' : 'success'}>{bank.visibility}</Tag>
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
          style={{
            flex: '3 1 860px',
            ...(isDark
              ? { background: 'linear-gradient(145deg, #171719 0%, #131316 100%)', border: '1px solid #2F2F33' }
              : {}),
          }}
          title="题库详情"
          extra={
            <Button
              type="primary"
              onClick={() => navigate('/music/guess-band')}
              style={{
                border: 'none',
                color: isDark ? '#E5E7EB' : '#FDF5ED',
                fontWeight: 700,
                background: isDark
                  ? 'linear-gradient(135deg, #4B5563 0%, #374151 100%)'
                  : 'linear-gradient(135deg, #FFB300 0%, #2E7BE6 100%)',
                boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.35)' : '0 4px 12px rgba(229, 57, 53, 0.32)',
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
                  <Tag color={isDark ? 'default' : countValid ? 'success' : 'error'}>
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
                  listStyle={{
                    width: 360,
                    height: 520,
                    ...(isDark ? { background: '#171719', color: '#E5E7EB', borderColor: '#2F2F33' } : {}),
                  }}
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

      <Card
        style={{
          marginTop: 16,
          ...(isDark
            ? { background: 'linear-gradient(145deg, #171719 0%, #131316 100%)', border: '1px solid #2F2F33' }
            : {}),
        }}
        title="公开题库大厅"
      >
        {publicBanks.length === 0 ? (
          <Text type="secondary">暂无其他人公开的题库。</Text>
        ) : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 360, flex: '1 1 360px' }}>
              <Input
                allowClear
                value={publicSearch}
                onChange={(event) => setPublicSearch(event.target.value)}
                placeholder="搜索题库名或作者"
                style={{ marginBottom: 10 }}
              />
              <List
                dataSource={filteredPublicBanks}
                locale={{ emptyText: '没有匹配的公开题库' }}
                renderItem={(bank) => (
                  <List.Item
                    style={{
                      cursor: 'pointer',
                      paddingInline: 8,
                      borderRadius: 8,
                      background: selectedPublicBankId === bank.id ? (isDark ? '#232327' : '#eef6ff') : undefined,
                    }}
                    onClick={() => openPublicBank(bank.id)}
                    actions={[
                      <Button
                        key={`use-public-${bank.id}`}
                        type="link"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/music/guess-band?share=${bank.shareToken}`);
                        }}
                      >
                        去使用
                      </Button>,
                      <Button
                        key={`copy-public-${bank.id}`}
                        type="link"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCopyPublicShareLink(bank);
                        }}
                      >
                        复制链接
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      title={bank.name}
                      description={
                        <Space size={8} wrap>
                          <Tag color={isDark ? 'default' : 'success'}>PUBLIC</Tag>
                          <Text type="secondary">作者：{bank.ownerUsername || '匿名'}</Text>
                          <Text type="secondary">{bank.itemCount || 0} 题</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>

            <div style={{ flex: '2 1 520px', minWidth: 0 }}>
              {!selectedPublicBank ? (
                <Alert type="info" showIcon message="请选择一个公开题库查看详情" />
              ) : publicDetailLoading ? (
                <div style={{ textAlign: 'center', padding: 24 }}>
                  <Spin />
                </div>
              ) : (
                <>
                  <Space size={8} wrap>
                    <Tag color={isDark ? 'default' : 'success'}>PUBLIC</Tag>
                    <Text strong>{selectedPublicBank.name}</Text>
                    <Text type="secondary">作者：{selectedPublicBank.ownerUsername || '匿名'}</Text>
                    <Text type="secondary">题数：{selectedPublicBank.itemCount || 0}</Text>
                  </Space>
                  <div style={{ marginTop: 12, maxHeight: 360, overflowY: 'auto' }}>
                    <Space wrap>
                      {(selectedPublicBank.artists || []).map((artist) => (
                        <Tag key={`public-artist-${artist.id}`} style={{ marginBottom: 8 }}>
                          {artist.name}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Card>

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
