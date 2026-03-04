import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Input,
  InputNumber,
  List,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CaretDownFilled,
  CaretUpFilled,
  CopyOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { guessBandOnlineApi } from '../api/guessBandOnline';
import { questionBanksApi } from '../api/questionBanks';
import { artistsApi } from '../api/artists';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resolveAvatarUrl } from '../utils/avatar';

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

const unwrapListData = (data) => {
  if (Array.isArray(data?.content)) {
    return data.content;
  }
  return Array.isArray(data) ? data : [];
};

const tokenStorageKey = (roomCode) => `guess-band-online-token:${roomCode}`;

const formatCountdown = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const min = Math.floor(safeSeconds / 60);
  const sec = safeSeconds % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

const resolveArtistPhotoUrl = (url) => {
  if (!url) {
    return '';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return new URL(url, window.location.origin).toString();
  }
  return url;
};

const styles = {
  board: {
    marginTop: 10,
    background: 'linear-gradient(180deg, #4A2C40 0%, #59364C 100%)',
    borderRadius: 14,
    padding: 10,
    border: '1px solid #6E4A5F',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '6px',
    tableLayout: 'fixed',
  },
  th: {
    background: '#F7F8FA',
    color: '#5A6472',
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 12,
    border: '1px solid #D9DEE6',
    letterSpacing: '0.4px',
  },
  tdBase: {
    padding: '12px 8px',
    textAlign: 'center',
    borderRadius: 12,
    color: '#F7F1F5',
    fontWeight: 600,
    fontSize: 13,
    background: '#5A3A4E',
  },
};

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
  const [bankItemCountMap, setBankItemCountMap] = useState({});
  const [selectedBank, setSelectedBank] = useState('default');
  const [maxAttempts, setMaxAttempts] = useState(10);
  const [totalRounds, setTotalRounds] = useState(3);
  const [timedMode, setTimedMode] = useState(false);
  const [roundTimeLimitSeconds, setRoundTimeLimitSeconds] = useState(60);

  const [artists, setArtists] = useState([]);
  const [records, setRecords] = useState([]);

  const [roomCode, setRoomCode] = useState('');
  const [playerToken, setPlayerToken] = useState('');
  const [room, setRoom] = useState(null);
  const [guessArtistId, setGuessArtistId] = useState(null);
  const [countdownTick, setCountdownTick] = useState(0);

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
    return room.status === 'IN_PROGRESS' && !room.awaitingNextRound;
  }, [room]);

  const canGoNextRound = useMemo(() => {
    if (!room) return false;
    return room.status === 'IN_PROGRESS' && room.awaitingNextRound;
  }, [room]);

  const canRematch = useMemo(() => {
    if (!room) return false;
    return room.status === 'FINISHED';
  }, [room]);

  const currentBankBandCount = useMemo(() => {
    if (!room) return null;
    if (!room.questionBankId) {
      return artists.length;
    }
    const count = bankItemCountMap[room.questionBankId];
    return Number.isFinite(count) ? count : null;
  }, [room, artists.length, bankItemCountMap]);

  const remainingSeconds = useMemo(() => {
    if (!room || room.status !== 'IN_PROGRESS' || !room.timedMode || !room.roundStartedAt || !room.roundTimeLimitSeconds) {
      return null;
    }
    const started = new Date(room.roundStartedAt).getTime();
    if (Number.isNaN(started)) {
      return null;
    }
    const deadline = started + room.roundTimeLimitSeconds * 1000;
    const remain = Math.ceil((deadline - Date.now()) / 1000);
    return Math.max(0, remain);
  }, [room, countdownTick]);

  const themedBoardStyles = useMemo(() => {
    if (isDark) {
      return {
        board: {
          ...styles.board,
          background: 'linear-gradient(180deg, #0F0F10 0%, #141416 100%)',
          border: '1px solid #2F2F33',
        },
        th: {
          ...styles.th,
          background: '#23262D',
          color: '#D6DBE4',
          border: '1px solid #3C424F',
        },
        tdBase: { ...styles.tdBase, background: '#18181B', color: '#E5E7EB' },
        table: styles.table,
      };
    }
    if (isBlue) {
      return {
        board: {
          ...styles.board,
          background: 'linear-gradient(180deg, #10243F 0%, #142B4A 100%)',
          border: '1px solid #2A4F82',
        },
        th: {
          ...styles.th,
          background: '#F4F7FC',
          color: '#51607A',
          border: '1px solid #C9D2E3',
        },
        tdBase: { ...styles.tdBase, background: '#122742', color: '#EDF3FF' },
        table: styles.table,
      };
    }
    return styles;
  }, [isBlue, isDark]);

  const getCellStyleByTheme = (state) => {
    if (state === 'exact') {
      return { background: isDark ? '#2C6660' : isBlue ? '#2A8F87' : '#1F8A70' };
    }
    if (state === 'close') {
      return { background: isDark ? '#52525B' : isBlue ? '#3D79BF' : '#7A5A35' };
    }
    return { background: isDark ? '#18181B' : isBlue ? '#122742' : '#5A3A4E' };
  };

  const renderTrendArrow = (arrow) => {
    if (!arrow) return null;
    const isUp = arrow === '↑';
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: 999,
          background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.2)',
        }}
      >
        {isUp ? <CaretUpFilled style={{ fontSize: 10 }} /> : <CaretDownFilled style={{ fontSize: 10 }} />}
      </span>
    );
  };

  const playersBySeat = useMemo(() => {
    const nextMap = new Map();
    (room?.players || []).forEach((player) => {
      if (player.seatIndex != null) {
        nextMap.set(player.seatIndex, player);
      }
    });
    return nextMap;
  }, [room?.players]);
  const currentRoundGuesses = useMemo(() => {
    const guesses = room?.guesses || [];
    const currentRound = room?.currentRound;
    if (!currentRound) {
      return guesses;
    }
    return guesses.filter((guess) => (guess?.roundIndex || currentRound) === currentRound);
  }, [room?.currentRound, room?.guesses]);

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
          artistsApi.getAll({ page: 0, size: 200 }),
          guessBandOnlineApi.getRecords(),
          questionBanksApi.getPublic(),
          isAuthenticated ? questionBanksApi.getMine() : Promise.resolve({ data: [] }),
        ]);
        if (!mounted) return;

        const playableArtists = unwrapListData(artistsRes.data).filter(isPlayableArtist);
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
        const nextCountMap = {};
        [...mineBanks, ...filteredPublicBanks].forEach((bank) => {
          if (bank?.id != null) {
            nextCountMap[bank.id] = Number(bank.itemCount || 0);
          }
        });
        setBankItemCountMap(nextCountMap);
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

  useEffect(() => {
    if (!room || room.status !== 'IN_PROGRESS' || !room.timedMode) return undefined;
    const timer = setInterval(() => {
      setCountdownTick((v) => v + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [room]);

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

  const copyText = async (text) => {
    if (!text) return false;
    if (navigator?.clipboard?.writeText && window?.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    let success = false;
    try {
      success = document.execCommand('copy');
    } finally {
      document.body.removeChild(textArea);
    }
    return success;
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
        totalRounds,
        timedMode,
        roundTimeLimitSeconds: timedMode ? roundTimeLimitSeconds : null,
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

  const handleNextRound = async () => {
    if (!roomCode || !playerToken) return;
    try {
      setActionLoading(true);
      const res = await guessBandOnlineApi.nextRound(roomCode, playerToken);
      setRoom(res.data);
    } catch (error) {
      message.error(error?.response?.data?.error || '进入下一轮失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRematch = async () => {
    if (!roomCode || !playerToken) return;
    try {
      setActionLoading(true);
      const res = await guessBandOnlineApi.rematch(roomCode, playerToken);
      setRoom(res.data);
      message.success('新一局已开始');
    } catch (error) {
      message.error(error?.response?.data?.error || '再来一盘失败');
    } finally {
      setActionLoading(false);
    }
  };

  const copyRoomCode = async () => {
    if (!room?.roomCode) return;
    try {
      const copied = await copyText(room.roomCode);
      if (copied) {
        message.success('房间号已复制');
      } else {
        message.info(`房间号：${room.roomCode}`);
      }
    } catch {
      message.info(`房间号：${room.roomCode}`);
    }
  };

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    try {
      const copied = await copyText(inviteLink);
      if (copied) {
        message.success('邀请链接已复制');
      } else {
        message.info(inviteLink);
      }
    } catch {
      message.info(inviteLink);
    }
  };

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
    <div className="guess-band-online-page" style={{ maxWidth: 1280, margin: '0 auto' }}>
      <Card className="guess-band-online-main-card" style={panelStyle}>
        <Title level={2} style={{ marginTop: 0, color: isDark ? '#E5E7EB' : isBlue ? '#274B7A' : '#5D4037' }}>
          猜乐队联机（双人私房）
        </Title>
        <Text style={{ color: isDark ? '#A3A3A3' : isBlue ? '#4D6F99' : '#7B5E57' }}>
          游客可玩。房主创建后分享房间号或邀请链接，双方可看到对方已猜乐队与正确/错误状态。
        </Text>

        <Row className="guess-band-online-entry-row" gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card size="small" title="创建房间" style={{ borderRadius: 10 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="你的显示名"
                />
                <Select value={selectedBank} options={bankOptions} onChange={setSelectedBank} />
                <div>
                  <Text strong>每轮最大猜测次数</Text>
                  <Text type="secondary" style={{ display: 'block' }}>每位玩家在单轮里最多可猜几次</Text>
                </div>
                <InputNumber
                  value={maxAttempts}
                  min={1}
                  max={30}
                  precision={0}
                  controls
                  addonAfter="次"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    if (value == null) return;
                    setMaxAttempts(value);
                  }}
                  placeholder="每轮最大猜测次数"
                />
                <div>
                  <Text strong>总轮次</Text>
                  <Text type="secondary" style={{ display: 'block' }}>整场对局共进行多少轮</Text>
                </div>
                <InputNumber
                  value={totalRounds}
                  min={1}
                  max={10}
                  precision={0}
                  controls
                  addonAfter="轮"
                  style={{ width: '100%' }}
                  onChange={(value) => {
                    if (value == null) return;
                    setTotalRounds(value);
                  }}
                  placeholder="总轮数"
                />
                <Space align="center">
                  <Switch checked={timedMode} onChange={setTimedMode} />
                  <Text>启用每轮限时</Text>
                </Space>
                {timedMode ? (
                  <InputNumber
                    value={roundTimeLimitSeconds}
                    min={10}
                    max={300}
                    precision={0}
                    controls
                    addonAfter="秒"
                    style={{ width: '100%' }}
                    onChange={(value) => {
                      if (value == null) return;
                      setRoundTimeLimitSeconds(value);
                    }}
                    placeholder="每轮时限（秒）"
                  />
                ) : null}
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
                <Space className="guess-band-online-join-actions" wrap>
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
                <Tag color={isDark ? 'default' : 'geekblue'}>
                  当前题库乐队：{currentBankBandCount == null ? '--' : currentBankBandCount} 支
                </Tag>
                <Tag color={room.status === 'FINISHED' ? 'default' : room.status === 'IN_PROGRESS' ? 'success' : 'blue'}>
                  状态：{room.status}
                </Tag>
                <Tag color="purple">
                  轮次：{room.currentRound || 0}/{room.totalRounds || 1}
                </Tag>
                <Tag>每人上限：{room.maxAttempts} 次</Tag>
                {room.timedMode ? (
                  <Tag color={remainingSeconds != null && remainingSeconds <= 10 ? 'red' : 'cyan'}>
                    倒计时：{remainingSeconds == null ? '--:--' : formatCountdown(remainingSeconds)}
                  </Tag>
                ) : (
                  <Tag>不限时</Tag>
                )}
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
                      <Text type="secondary">得分 {p.score ?? 0}</Text>
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
                  手动开始（自动开局兜底）
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

              {canGoNextRound ? (
                <Alert
                  type="info"
                  showIcon
                  message="本轮已结束，请点击“进入下一轮”继续。"
                />
              ) : null}

              {room.roundAnswer ? (
                <Card
                  size="small"
                  title={canRematch ? '本局最后一轮正确答案' : '本轮正确答案'}
                  style={{ borderRadius: 10 }}
                >
                  <Space size={16} align="start" wrap>
                    {room.roundAnswer.artistPhotoUrl ? (
                      <img
                        src={resolveArtistPhotoUrl(room.roundAnswer.artistPhotoUrl)}
                        alt={room.roundAnswer.artistName}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 10,
                          objectFit: 'cover',
                          border: isDark ? '1px solid #2F2F33' : '1px solid #E5E7EB',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isDark ? '#17171A' : '#F3F4F6',
                          color: isDark ? '#A3A3A3' : '#6B7280',
                        }}
                      >
                        暂无图片
                      </div>
                    )}
                    <Space direction="vertical" size={2}>
                      <Text strong style={{ fontSize: 16 }}>
                        {room.roundAnswer.artistName}
                      </Text>
                    </Space>
                  </Space>
                </Card>
              ) : null}

              {canGoNextRound ? (
                <Button type="primary" onClick={handleNextRound} loading={actionLoading}>
                  进入下一轮
                </Button>
              ) : null}

              {canRematch ? (
                <Button type="primary" onClick={handleRematch} loading={actionLoading}>
                  再来一盘
                </Button>
              ) : null}

              <div className="guess-band-online-board" style={themedBoardStyles.board}>
                <div className="guess-band-online-table-scroll">
                <table style={themedBoardStyles.table}>
                  <thead>
                    <tr>
                      <th style={{ ...themedBoardStyles.th, width: '17%' }}>PLAYER</th>
                      <th style={{ ...themedBoardStyles.th, width: '21%' }}>BAND</th>
                      <th style={{ ...themedBoardStyles.th, width: '12%' }}>REGION</th>
                      <th style={{ ...themedBoardStyles.th, width: '16%' }}>GENRE</th>
                      <th style={{ ...themedBoardStyles.th, width: '10%' }}>YEAR</th>
                      <th style={{ ...themedBoardStyles.th, width: '10%' }}>MEM</th>
                      <th style={{ ...themedBoardStyles.th, width: '14%' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRoundGuesses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            ...themedBoardStyles.tdBase,
                            padding: '20px 10px',
                            color: isDark ? '#9CA3AF' : isBlue ? '#AFC4E1' : '#D2BCC8',
                          }}
                        >
                          本轮还没有猜测记录
                        </td>
                      </tr>
                    ) : (
                      currentRoundGuesses.slice().reverse().map((guess) => {
                        const player = playersBySeat.get(guess.playerSeatIndex);
                        return (
                          <tr key={guess.id}>
                            <td style={{ ...themedBoardStyles.tdBase, textAlign: 'left' }}>
                              <Space size={8} align="center" style={{ width: '100%' }}>
                                <Avatar
                                  size={26}
                                  src={resolveAvatarUrl(player?.avatarUrl)}
                                  alt={player?.displayName || guess.playerDisplayName}
                                />
                                <span
                                  style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {player?.displayName || guess.playerDisplayName}
                                </span>
                              </Space>
                            </td>
                            <td style={themedBoardStyles.tdBase}>{guess.artistName}</td>
                            <td style={{ ...themedBoardStyles.tdBase, ...getCellStyleByTheme(guess.regionState) }}>
                              {guess.regionValue}
                            </td>
                            <td style={{ ...themedBoardStyles.tdBase, ...getCellStyleByTheme(guess.genreState) }}>
                              {guess.genreValue}
                            </td>
                            <td style={{ ...themedBoardStyles.tdBase, ...getCellStyleByTheme(guess.yearState) }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {guess.yearValue}
                                {renderTrendArrow(guess.yearArrow)}
                              </span>
                            </td>
                            <td style={{ ...themedBoardStyles.tdBase, ...getCellStyleByTheme(guess.membersState) }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                {guess.membersValue}
                                {renderTrendArrow(guess.membersArrow)}
                              </span>
                            </td>
                            <td style={{ ...themedBoardStyles.tdBase, ...getCellStyleByTheme(guess.statusState) }}>
                              {guess.statusValue}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                </div>
              </div>
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
