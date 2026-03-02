import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  List,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { CopyOutlined, LinkOutlined, PlayCircleOutlined, SendOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { guessBandOnlineApi } from '../api/guessBandOnline';
import { questionBanksApi } from '../api/questionBanks';
import { artistsApi } from '../api/artists';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;

const isPlayableArtist = (artist) =>
  Boolean(
    artist?.name &&
      artist?.country &&
      artist?.formedYear &&
      artist?.genre &&
      artist?.memberCount &&
      artist?.status
  );

const tokenStorageKey = (roomCode) => `guess-band-online-token:${roomCode}`;

const GuessBandOnline = () => {
  const { isAuthenticated, user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const isBlue = theme === 'blue';
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [displayName, setDisplayName] = useState(user?.username || '');
  const [joinDisplayName, setJoinDisplayName] = useState(user?.username || '');
  const [roomInput, setRoomInput] = useState('');
  const [bankOptions, setBankOptions] = useState([{ value: 'default', label: '默认题库' }]);
  const [selectedBank, setSelectedBank] = useState('default');
  const [maxAttempts, setMaxAttempts] = useState(10);

  const [artists, setArtists] = useState([]);
  const [records, setRecords] = useState([]);

  const [roomCode, setRoomCode] = useState('');
  const [playerToken, setPlayerToken] = useState('');
  const [room, setRoom] = useState(null);
  const [guessArtistId, setGuessArtistId] = useState(null);

  const meIsHost = useMemo(() => {
    if (!room || !playerToken) return false;
    const me = room.players?.find((p) => p.host && p.displayName);
    const hasInvite = Boolean(room.inviteToken);
    if (!hasInvite) {
      return false;
    }
    return Boolean(me);
  }, [room, playerToken]);

  const inviteLink = useMemo(() => {
    if (!room?.inviteToken) {
      return '';
    }
    return `${window.location.origin}/music/guess-band/online?t=${room.inviteToken}`;
  }, [room]);

  const canStart = useMemo(() => {
    if (!room) return false;
    return room.status === 'WAITING' && (room.players?.length || 0) === 2 && Boolean(room.inviteToken);
  }, [room]);

  const canGuess = useMemo(() => {
    if (!room) return false;
    return room.status === 'IN_PROGRESS';
  }, [room]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteToken = params.get('t');
    if (inviteToken) {
      setRoomInput(inviteToken);
    }
  }, [location.search]);

  useEffect(() => {
    const initialName = user?.username || '';
    setDisplayName((prev) => prev || initialName);
    setJoinDisplayName((prev) => prev || initialName);
  }, [user?.username]);

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      setLoading(true);
      try {
        const [artistsRes, recordsRes, publicBanksRes, mineBanksRes] = await Promise.all([
          artistsApi.getAll(),
          guessBandOnlineApi.getRecords(),
          questionBanksApi.getPublic(),
          isAuthenticated ? questionBanksApi.getMine() : Promise.resolve({ data: [] }),
        ]);
        if (!mounted) return;

        const playableArtists = (artistsRes.data || []).filter(isPlayableArtist);
        setArtists(playableArtists);
        setRecords(recordsRes.data || []);

        const publicBanks = publicBanksRes.data || [];
        const mineBanks = mineBanksRes.data || [];
        const filteredPublicBanks = publicBanks.filter((bank) => {
          if (!isAuthenticated) return true;
          if (user?.id != null && bank.ownerUserId != null) {
            return bank.ownerUserId !== user.id;
          }
          if (user?.username && bank.ownerUsername) {
            return bank.ownerUsername !== user.username;
          }
          return true;
        });

        const nextOptions = [
          { value: 'default', label: `默认题库 (${playableArtists.length})` },
          ...mineBanks.map((bank) => ({ value: `mine:${bank.id}`, label: `${bank.name} (${bank.itemCount || 0})` })),
          ...filteredPublicBanks.map((bank) => ({
            value: `public:${bank.id}`,
            label: `公开 · ${bank.name}（${bank.ownerUsername || '匿名'}） (${bank.itemCount || 0})`,
          })),
        ];
        setBankOptions(nextOptions);
      } catch (error) {
        message.error(error?.response?.data?.error || '加载联机数据失败');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMeta();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user?.id, user?.username]);

  useEffect(() => {
    if (!roomCode || !playerToken) return;

    const timer = setInterval(async () => {
      try {
        const res = await guessBandOnlineApi.getRoom(roomCode, playerToken);
        setRoom(res.data);
      } catch {
        // keep polling quiet
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [roomCode, playerToken]);

  const mapBankValueToId = (value) => {
    if (!value || value === 'default') {
      return null;
    }
    const [, id] = value.split(':');
    const bankId = Number(id);
    return Number.isFinite(bankId) ? bankId : null;
  };

  const applyJoinResult = (res) => {
    const nextToken = res?.data?.playerToken;
    const nextRoom = res?.data?.room;
    if (!nextToken || !nextRoom?.roomCode) {
      throw new Error('invalid join response');
    }
    setPlayerToken(nextToken);
    setRoomCode(nextRoom.roomCode);
    setRoom(nextRoom);
    localStorage.setItem(tokenStorageKey(nextRoom.roomCode), nextToken);
  };

  const refreshRecords = async () => {
    try {
      const res = await guessBandOnlineApi.getRecords();
      setRecords(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleCreateRoom = async () => {
    if (!displayName.trim()) {
      message.warning('请输入你的显示名');
      return;
    }
    try {
      setCreating(true);
      const res = await guessBandOnlineApi.createRoom({
        displayName: displayName.trim(),
        questionBankId: mapBankValueToId(selectedBank),
        maxAttempts,
      });
      applyJoinResult(res);
      message.success('房间已创建');
    } catch (error) {
      message.error(error?.response?.data?.error || '创建房间失败');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinDisplayName.trim()) {
      message.warning('请输入你的显示名');
      return;
    }
    if (!roomInput.trim()) {
      message.warning('请输入房间号或邀请链接');
      return;
    }
    try {
      setJoining(true);
      const res = await guessBandOnlineApi.joinRoom({
        displayName: joinDisplayName.trim(),
        roomCodeOrToken: roomInput.trim(),
      });
      applyJoinResult(res);
      message.success('已加入房间');
    } catch (error) {
      message.error(error?.response?.data?.error || '加入房间失败');
    } finally {
      setJoining(false);
    }
  };

  const handleResume = async () => {
    const code = roomInput.trim().toUpperCase();
    if (!code) {
      message.warning('先输入房间号');
      return;
    }
    const token = localStorage.getItem(tokenStorageKey(code));
    if (!token) {
      message.warning('未找到该房间的本地玩家令牌');
      return;
    }

    try {
      setActionLoading(true);
      const res = await guessBandOnlineApi.getRoom(code, token);
      setRoomCode(code);
      setPlayerToken(token);
      setRoom(res.data);
      message.success('已恢复房间会话');
    } catch (error) {
      message.error(error?.response?.data?.error || '恢复失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    if (!roomCode || !playerToken) return;
    try {
      setActionLoading(true);
      const res = await guessBandOnlineApi.startRoom(roomCode, playerToken);
      setRoom(res.data);
      message.success('对局已开始');
    } catch (error) {
      message.error(error?.response?.data?.error || '开始失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGuess = async () => {
    if (!roomCode || !playerToken) return;
    if (!guessArtistId) {
      message.warning('请选择乐队名');
      return;
    }

    try {
      setActionLoading(true);
      const res = await guessBandOnlineApi.submitGuess(roomCode, playerToken, guessArtistId);
      setRoom(res.data);
      setGuessArtistId(null);
      if (res?.data?.status === 'FINISHED') {
        refreshRecords();
      }
    } catch (error) {
      message.error(error?.response?.data?.error || '提交猜测失败');
    } finally {
      setActionLoading(false);
    }
  };

  const copyRoomCode = async () => {
    if (!room?.roomCode) return;
    try {
      await navigator.clipboard.writeText(room.roomCode);
      message.success('房间号已复制');
    } catch {
      message.info(`房间号：${room.roomCode}`);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      message.success('邀请链接已复制');
    } catch {
      message.info(inviteLink);
    }
  };

  const guessColumns = [
    {
      title: '玩家',
      dataIndex: 'playerDisplayName',
      key: 'playerDisplayName',
    },
    {
      title: '已猜乐队',
      dataIndex: 'artistName',
      key: 'artistName',
    },
    {
      title: '结果',
      dataIndex: 'correct',
      key: 'correct',
      render: (value) => (value ? <Tag color="success">正确</Tag> : <Tag color="error">错误</Tag>),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const panelStyle = {
    borderRadius: 14,
    border: isDark ? '1px solid #2F2F33' : isBlue ? '1px solid #C9DDFB' : '1px solid #E8D5C4',
    background: isDark
      ? 'linear-gradient(180deg, #161618 0%, #121214 100%)'
      : isBlue
      ? 'linear-gradient(180deg, #F8FBFF 0%, #EEF5FF 100%)'
      : 'linear-gradient(180deg, #FFFBF7 0%, #FDF5ED 100%)',
  };

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto' }}>
      <Card style={panelStyle}>
        <Title level={2} style={{ marginTop: 0, color: isDark ? '#E5E7EB' : isBlue ? '#274B7A' : '#5D4037' }}>
          猜乐队联机（双人私房）
        </Title>
        <Text style={{ color: isDark ? '#A3A3A3' : isBlue ? '#4D6F99' : '#7B5E57' }}>
          游客可玩。房主创建后分享房间号或邀请链接，双方可看到对方已猜乐队与正确/错误状态。
        </Text>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card size="small" title="创建房间" style={{ borderRadius: 10 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的显示名"
                />
                <Select value={selectedBank} options={bankOptions} onChange={setSelectedBank} />
                <Input
                  type="number"
                  value={maxAttempts}
                  min={1}
                  max={30}
                  onChange={(e) => setMaxAttempts(Number(e.target.value || 10))}
                  placeholder="最大尝试次数"
                />
                <Button type="primary" loading={creating} onClick={handleCreateRoom}>
                  创建并进入
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card size="small" title="加入/恢复房间" style={{ borderRadius: 10 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={joinDisplayName}
                  onChange={(e) => setJoinDisplayName(e.target.value)}
                  placeholder="你的显示名"
                />
                <Input
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                  placeholder="房间号 / 邀请令牌 / 邀请链接"
                />
                <Space wrap>
                  <Button type="primary" loading={joining} onClick={handleJoinRoom} icon={<LinkOutlined />}>
                    加入
                  </Button>
                  <Button onClick={handleResume} loading={actionLoading}>
                    恢复本机会话
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>

        {room ? (
          <Card size="small" title="当前房间" style={{ marginTop: 16, borderRadius: 10 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                <Tag color="processing">房间号：{room.roomCode}</Tag>
                <Tag color="gold">题库：{room.questionBankName || '默认题库'}</Tag>
                <Tag color={room.status === 'FINISHED' ? 'default' : room.status === 'IN_PROGRESS' ? 'success' : 'blue'}>
                  状态：{room.status}
                </Tag>
                <Tag>每人上限：{room.maxAttempts} 次</Tag>
                <Button size="small" icon={<CopyOutlined />} onClick={copyRoomCode}>
                  复制房间号
                </Button>
                {inviteLink ? (
                  <Button size="small" icon={<LinkOutlined />} onClick={copyInviteLink}>
                    复制邀请链接
                  </Button>
                ) : null}
              </Space>

              <List
                size="small"
                bordered
                dataSource={room.players || []}
                renderItem={(p) => (
                  <List.Item>
                    <Space>
                      <Tag color={p.host ? 'purple' : 'geekblue'}>{p.host ? '房主' : '玩家'}</Tag>
                      <Text>{p.displayName}</Text>
                      <Text type="secondary">已猜 {p.guessCount}/{room.maxAttempts}</Text>
                    </Space>
                  </List.Item>
                )}
              />

              {canStart ? (
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleStart}
                  loading={actionLoading}
                >
                  开始对局
                </Button>
              ) : null}

              {canGuess ? (
                <Space.Compact style={{ width: '100%' }}>
                  <Select
                    showSearch
                    value={guessArtistId}
                    onChange={setGuessArtistId}
                    placeholder="按名称选择乐队"
                    style={{ width: '100%' }}
                    optionFilterProp="children"
                    filterOption={(input, option) =>
                      (option?.children || '').toLowerCase().includes(input.toLowerCase())
                    }
                  >
                    {artists.map((artist) => (
                      <Select.Option key={artist.id} value={artist.id}>
                        {artist.name}
                      </Select.Option>
                    ))}
                  </Select>
                  <Button type="primary" icon={<SendOutlined />} onClick={handleGuess} loading={actionLoading}>
                    提交猜测
                  </Button>
                </Space.Compact>
              ) : null}

              {room.status === 'FINISHED' ? (
                <Alert
                  type="success"
                  showIcon
                  message={room.winnerDisplayName ? `本局胜者：${room.winnerDisplayName}` : '本局平局'}
                />
              ) : null}

              <Table
                rowKey="id"
                columns={guessColumns}
                dataSource={room.guesses || []}
                pagination={{ pageSize: 10 }}
                size="small"
              />
            </Space>
          </Card>
        ) : null}

        <Card size="small" title="最近比赛记录" style={{ marginTop: 16, borderRadius: 10 }}>
          <Table
            rowKey="id"
            size="small"
            dataSource={records}
            pagination={{ pageSize: 8 }}
            columns={[
              { title: '房间', dataIndex: 'roomCode', key: 'roomCode' },
              { title: '题库', dataIndex: 'questionBankName', key: 'questionBankName', render: (v) => v || '默认题库' },
              { title: '房主', dataIndex: 'hostDisplayName', key: 'hostDisplayName' },
              { title: '客方', dataIndex: 'guestDisplayName', key: 'guestDisplayName' },
              {
                title: '胜者',
                dataIndex: 'winnerDisplayName',
                key: 'winnerDisplayName',
                render: (v) => (v ? <Tag color="success">{v}</Tag> : <Tag>平局</Tag>),
              },
              { title: '总猜测', dataIndex: 'totalGuesses', key: 'totalGuesses' },
            ]}
          />
        </Card>
      </Card>
    </div>
  );
};

export default GuessBandOnline;
