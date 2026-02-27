import { useEffect, useMemo, useState } from 'react';
import { Alert, AutoComplete, Button, Card, Input, InputNumber, Select, Space, Spin, Tag, Typography, message } from 'antd';
import { TrophyOutlined, ReloadOutlined, RocketOutlined, AppstoreOutlined, TagsOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { artistsApi } from '../api/artists';
import { questionBanksApi } from '../api/questionBanks';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const DEFAULT_MAX_ATTEMPTS = 10;

const styles = {
  wrapper: {
    maxWidth: 1320,
    margin: '0 auto',
  },
  layoutRow: {
    display: 'flex',
    gap: 16,
    alignItems: 'stretch',
    flexWrap: 'wrap',
  },
  sideCard: {
    width: 220,
    flex: '1 1 220px',
    borderRadius: 16,
    border: '1px solid #E8D5C4',
    background: 'linear-gradient(180deg, #FFF8EF 0%, #FFF2E6 100%)',
    boxShadow: '0 4px 14px rgba(139, 69, 19, 0.08)',
  },
  sideTitle: {
    marginBottom: 10,
    color: '#5D4037',
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
  },
  sideSubtitle: {
    color: '#8D6E63',
    fontSize: 13,
    lineHeight: 1.6,
  },
  centerWrap: {
    flex: '3 1 720px',
    minWidth: 0,
  },
  heroCard: {
    borderRadius: 16,
    border: '1px solid #E8D5C4',
    background: 'linear-gradient(180deg, #FFF8EF 0%, #FFF2E6 100%)',
    boxShadow: '0 6px 18px rgba(139, 69, 19, 0.1)',
    overflow: 'hidden',
  },
  title: {
    marginTop: 12,
    marginBottom: 10,
    color: '#4E342E',
    fontFamily: "'ZCOOL KuaiLe', 'Noto Sans SC', 'Noto Serif SC', cursive",
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  subtitle: {
    color: '#7C5A4E',
    fontSize: 16,
  },
  artistsLinkButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(47, 140, 82, 0.24)',
    background: 'linear-gradient(135deg, #2D9A56 0%, #217A44 100%)',
    border: 'none',
  },
  genresLinkButton: {
    marginTop: 12,
    height: 44,
    borderRadius: 10,
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(184, 134, 11, 0.22)',
    background: 'linear-gradient(135deg, #C99B39 0%, #A4781A 100%)',
    border: 'none',
  },
  actionRow: {
    marginTop: 18,
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  attemptsTitle: {
    marginTop: 28,
    marginBottom: 14,
    color: '#5D4037',
    fontFamily: "'Playfair Display', 'Noto Serif SC', Georgia, serif",
  },
  board: {
    marginTop: 16,
    background: 'linear-gradient(180deg, #2A1425 0%, #31192D 100%)',
    borderRadius: 14,
    padding: 10,
    border: '1px solid #57314D',
  },
  table: {
    width: '100%',
    borderCollapse: 'separate',
    borderSpacing: '6px',
    tableLayout: 'fixed',
  },
  th: {
    background: '#4B3544',
    color: '#F5ECF1',
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: 13,
    borderRadius: 8,
    letterSpacing: '0.4px',
  },
  tdBase: {
    padding: '12px 8px',
    textAlign: 'center',
    borderRadius: 8,
    color: '#F7F1F5',
    fontWeight: 600,
    fontSize: 13,
    background: '#2B1627',
  },
  answerCard: {
    marginTop: 16,
    borderRadius: 12,
    border: '1px solid #C8E6C9',
    background: 'linear-gradient(180deg, #F6FFF4 0%, #EEFAEA 100%)',
  },
};

const CATEGORY_GROUPS = {
  UK: 'EU',
  Ireland: 'EU',
  Germany: 'EU',
  Italy: 'EU',
  US: 'NA',
  Australia: 'OC',
  Japan: 'JP',
  华语: 'CN',
};

const GENRE_GROUPS = {
  Rock: 'ROCK',
  'Hard Rock': 'ROCK',
  'Progressive Rock': 'ROCK',
  'Alternative Rock': 'ALT',
  'Indie Rock': 'ALT',
  'Funk Rock': 'ALT',
  Britpop: 'ALT',
  'Post Punk': 'ALT',
  'Nu Metal': 'METAL',
  'Industrial Metal': 'METAL',
  Metal: 'METAL',
  Grunge: 'ALT',
  'Punk Rock': 'PUNK',
  'Pop Punk': 'PUNK',
  'Pop Rock': 'POP',
  'Indie Pop': 'POP',
  'New Wave': 'ALT',
  'Folk Rock': 'ALT',
};

const pickRandomBand = (bands, excludeBand = null) => {
  if (!bands.length) {
    return null;
  }
  if (bands.length <= 1) {
    return bands[0];
  }
  const filtered = excludeBand
    ? bands.filter((band) => band.name !== excludeBand.name)
    : bands;
  return filtered[Math.floor(Math.random() * filtered.length)];
};

const normalizeBand = (value) => value.trim().toLowerCase();

const compareCategory = (guessValue, targetValue, groupMap = null) => {
  if (guessValue === targetValue) {
    return 'exact';
  }
  if (groupMap && groupMap[guessValue] && groupMap[guessValue] === groupMap[targetValue]) {
    return 'close';
  }
  return 'miss';
};

const compareNumber = (guessValue, targetValue, closeDistance) => {
  if (guessValue === targetValue) {
    return { state: 'exact', arrow: '' };
  }
  const arrow = guessValue < targetValue ? '↑' : '↓';
  const state = Math.abs(guessValue - targetValue) <= closeDistance ? 'close' : 'miss';
  return { state, arrow };
};

const getCellStyle = (state) => {
  if (state === 'exact') {
    return { background: '#2F5B42' };
  }
  if (state === 'close') {
    return { background: '#7A5A35' };
  }
  return { background: '#2B1627' };
};

const buildGuessResult = (guessBand, targetBand) => {
  const regionState = compareCategory(guessBand.region, targetBand.region, CATEGORY_GROUPS);
  const genreState = compareCategory(guessBand.genre, targetBand.genre, GENRE_GROUPS);
  const year = compareNumber(guessBand.yearFormed, targetBand.yearFormed, 5);
  const members = compareNumber(guessBand.members, targetBand.members, 1);
  const statusState = compareCategory(guessBand.status, targetBand.status);

  return {
    bandName: guessBand.name,
    region: { value: guessBand.region, state: regionState },
    genre: { value: guessBand.genre, state: genreState },
    year: { value: guessBand.yearFormed, state: year.state, arrow: year.arrow },
    members: { value: guessBand.members, state: members.state, arrow: members.arrow },
    status: { value: guessBand.status, state: statusState },
    correct: guessBand.name === targetBand.name,
  };
};

const isPlayableArtist = (artist) =>
  Boolean(
    artist?.name &&
      artist?.country &&
      artist?.formedYear &&
      artist?.genre &&
      artist?.memberCount &&
      artist?.status
  );

const toGameBand = (artist) => ({
  name: artist.name.trim(),
  region: artist.country.trim(),
  genre: artist.genre.trim(),
  yearFormed: artist.formedYear,
  members: artist.memberCount,
  status: artist.status.trim(),
});

const GuessBand = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bankSwitching, setBankSwitching] = useState(false);
  const [allBands, setAllBands] = useState([]);
  const [bankOptions, setBankOptions] = useState([]);
  const [currentBankKey, setCurrentBankKey] = useState('default');
  const [currentBankLabel, setCurrentBankLabel] = useState('默认题库');
  const [shareBank, setShareBank] = useState(null);
  const [targetBand, setTargetBand] = useState(null);
  const [guessInput, setGuessInput] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [solved, setSolved] = useState(false);
  const [roundOver, setRoundOver] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(DEFAULT_MAX_ATTEMPTS);
  const [countryInput, setCountryInput] = useState('');

  useEffect(() => {
    const loadBands = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams(location.search);
        const shareToken = params.get('share');

        const [artistsRes, mineBanksRes] = await Promise.all([
          artistsApi.getAll(),
          isAuthenticated ? questionBanksApi.getMine() : Promise.resolve({ data: [] }),
        ]);

        const gameBands = (artistsRes.data || []).filter(isPlayableArtist).map(toGameBand);
        setAllBands(gameBands);

        const mineBanks = mineBanksRes.data || [];
        const mineOptions = mineBanks.map((bank) => ({
          value: `mine:${bank.id}`,
          label: `${bank.name} (${bank.itemCount || 0})`,
        }));

        let nextOptions = [{ value: 'default', label: `默认题库 (${gameBands.length})` }, ...mineOptions];
        let nextBands = gameBands;
        let nextBankKey = 'default';
        let nextBankLabel = '默认题库';

        if (shareToken) {
          try {
            const shareRes = await questionBanksApi.getByShareToken(shareToken);
            const sharedDetail = shareRes.data;
            const sharedBands = (sharedDetail?.artists || []).filter(isPlayableArtist).map(toGameBand);
            if (sharedBands.length > 0) {
              setShareBank(sharedDetail);
              nextBands = sharedBands;
              nextBankKey = `share:${sharedDetail.shareToken}`;
              nextBankLabel = `${sharedDetail.name}（分享）`;
              nextOptions = [...nextOptions, { value: nextBankKey, label: `${nextBankLabel} (${sharedBands.length})` }];
            } else {
              message.warning('分享题库暂无可用题目，已回退默认题库');
            }
          } catch {
            message.warning('分享题库加载失败，已回退默认题库');
          }
        }

        setBankOptions(nextOptions);
        setBands(nextBands);
        setCurrentBankKey(nextBankKey);
        setCurrentBankLabel(nextBankLabel);
        setTargetBand(pickRandomBand(nextBands));
      } catch {
        message.error('加载乐队数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadBands();
  }, [isAuthenticated, location.search]);

  useEffect(() => {
    if (!roundOver && !solved && attempts.length >= maxAttempts && attempts.length > 0) {
      setRoundOver(true);
      if (targetBand) {
        message.error(`本轮最多尝试 ${maxAttempts} 次，答案是 ${targetBand.name}`);
      }
    }
  }, [attempts.length, maxAttempts, roundOver, solved, targetBand]);

  const filteredBands = useMemo(() => {
    const keyword = normalizeBand(guessInput);
    if (!keyword) {
      return bands.slice(0, 10);
    }
    return bands
      .filter((band) => normalizeBand(band.name).includes(keyword))
      .slice(0, 10);
  }, [bands, guessInput]);

  const countryMatchedBands = useMemo(() => {
    const keyword = countryInput.trim().toLowerCase();
    const sortedBands = [...bands].sort((a, b) => a.name.localeCompare(b.name));
    if (!keyword) {
      return sortedBands.slice(0, 24);
    }
    return sortedBands
      .filter((band) => band.region.toLowerCase().includes(keyword))
      .slice(0, 50);
  }, [bands, countryInput]);

  const resetRoundWithBands = (nextBands, excludeCurrent = false) => {
    setGuessInput('');
    setAttempts([]);
    setSolved(false);
    setRoundOver(false);
    setCountryInput('');
    setTargetBand((prevTarget) => pickRandomBand(nextBands, excludeCurrent ? prevTarget : null));
  };

  const handleBankChange = async (value) => {
    if (value === currentBankKey) {
      return;
    }

    if (value === 'default') {
      setCurrentBankKey('default');
      setCurrentBankLabel('默认题库');
      setBands(allBands);
      resetRoundWithBands(allBands);
      return;
    }

    if (value.startsWith('share:') && shareBank) {
      const sharedBands = (shareBank.artists || []).filter(isPlayableArtist).map(toGameBand);
      if (!sharedBands.length) {
        message.warning('分享题库暂无可用题目');
        return;
      }
      setCurrentBankKey(value);
      setCurrentBankLabel(`${shareBank.name}（分享）`);
      setBands(sharedBands);
      resetRoundWithBands(sharedBands);
      return;
    }

    if (!value.startsWith('mine:')) {
      return;
    }

    const id = Number(value.replace('mine:', ''));
    if (!id) {
      return;
    }

    try {
      setBankSwitching(true);
      const detailRes = await questionBanksApi.getMineById(id);
      const detail = detailRes.data;
      const nextBands = (detail.artists || []).filter(isPlayableArtist).map(toGameBand);
      if (!nextBands.length) {
        message.warning('该题库暂无可用题目');
        return;
      }
      setCurrentBankKey(value);
      setCurrentBankLabel(detail.name);
      setBands(nextBands);
      resetRoundWithBands(nextBands);
    } catch {
      message.error('加载题库失败');
    } finally {
      setBankSwitching(false);
    }
  };

  const restartRound = () => {
    resetRoundWithBands(bands, true);
  };

  const submitGuess = (inputValue = guessInput) => {
    const finalInput = typeof inputValue === 'string' ? inputValue : guessInput;
    if (!finalInput.trim()) {
      message.warning('先输入一个乐队名');
      return;
    }
    if (roundOver) {
      message.info(
        solved
          ? '这一轮已经猜中，点击“下一题”开始新一轮'
          : `本轮已用完 ${maxAttempts} 次机会，点击“下一题”开始新一轮`
      );
      return;
    }
    if (!targetBand) {
      message.warning('乐队题库未就绪');
      return;
    }

    const normalizedInput = normalizeBand(finalInput);
    const matchedBand = bands.find((band) => normalizeBand(band.name) === normalizedInput);

    if (!matchedBand) {
      message.warning('请从乐队库里选择一个名字（可参考下方联想）');
      return;
    }

    const duplicated = attempts.some((attempt) => normalizeBand(attempt.bandName) === normalizedInput);
    if (duplicated) {
      message.warning('这个乐队你已经猜过了');
      return;
    }

    const resultRow = buildGuessResult(matchedBand, targetBand);
    const isCorrect = resultRow.correct;
    const nextAttempts = [resultRow, ...attempts];
    setAttempts(nextAttempts);
    setGuessInput('');

    if (isCorrect) {
      setSolved(true);
      setRoundOver(true);
      message.success(`猜中了！答案是 ${targetBand.name}`);
      return;
    }

    if (nextAttempts.length >= maxAttempts) {
      setRoundOver(true);
      message.error(`本轮最多尝试 ${maxAttempts} 次，答案是 ${targetBand.name}`);
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
    <div style={styles.wrapper}>
      <div style={styles.layoutRow}>
        <Card style={styles.sideCard}>
          <Title level={4} style={styles.sideTitle}>
            国家筛选
          </Title>
          <Input
            placeholder="输入国家/地区，如 UK、US、华语"
            value={countryInput}
            onChange={(event) => setCountryInput(event.target.value)}
            allowClear
          />
          <div style={{ marginTop: 14 }}>
            <Text strong style={{ color: '#5D4037' }}>匹配乐队</Text>
          </div>
          <div style={{ marginTop: 10, maxHeight: 560, overflowY: 'auto' }}>
            <Space wrap>
              {countryMatchedBands.length === 0 ? (
                <Text style={styles.sideSubtitle}>没有匹配结果</Text>
              ) : (
                countryMatchedBands.map((band) => (
                  <Tag
                    key={`country-${band.name}`}
                    color="processing"
                    style={{ cursor: 'pointer', marginBottom: 8 }}
                    onClick={() => setGuessInput(band.name)}
                  >
                    {band.name}
                  </Tag>
                ))
              )}
            </Space>
          </div>
        </Card>

        <div style={styles.centerWrap}>
          <Card style={styles.heroCard}>
        <Space size="middle" wrap>
          <Tag color="success">默认 {DEFAULT_MAX_ATTEMPTS} 次</Tag>
          <Tag color="gold">乐队库 {bands.length} 支</Tag>
          <Tag color="processing">当前题库：{currentBankLabel}</Tag>
          <Text strong>本轮尝试 {attempts.length}/{maxAttempts} 次</Text>
          <Space size={6} align="center">
            <Text>上限</Text>
            <InputNumber
              min={1}
              max={100}
              value={maxAttempts}
              onChange={(value) => {
                if (typeof value === 'number') {
                  setMaxAttempts(value);
                }
              }}
              disabled={roundOver}
              size="small"
            />
            <Text>次</Text>
          </Space>
          <Space size={6} align="center">
            <Text>切换题库</Text>
            <Select
              value={currentBankKey}
              options={bankOptions}
              onChange={handleBankChange}
              loading={bankSwitching}
              style={{ minWidth: 240 }}
            />
          </Space>
        </Space>

        <div style={styles.titleRow}>
          <div>
            <Title level={1} style={styles.title}>
              猜乐队
            </Title>
            <Text style={styles.subtitle}>
              支持默认题库、你的自选题库和分享题库。每轮最多猜 {maxAttempts} 次，猜中或用尽机会后可开始下一题。
            </Text>
          </div>
          <Space size={10} wrap>
            <Button
              type="primary"
              size="large"
              icon={<AppstoreOutlined />}
              href="/music/artists"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.artistsLinkButton}
            >
              查看所有乐队
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<TagsOutlined />}
              href="/music/genres"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.genresLinkButton}
            >
              查看所有风格
            </Button>
            {isAuthenticated ? (
              <Button size="large" href="/music/guess-band/banks" target="_blank" rel="noopener noreferrer">
                管理自选题库
              </Button>
            ) : null}
          </Space>
        </div>

        {bands.length === 0 ? (
          <Alert
            style={{ marginTop: 16 }}
            type="warning"
            showIcon
            message="当前没有可用题目"
            description="请先在后端艺术家数据中补齐字段：name、country、formedYear、genre、memberCount、status。"
          />
        ) : null}

        <div style={styles.actionRow}>
          <AutoComplete
            size="large"
            value={guessInput}
            onChange={(value) => setGuessInput(value)}
            onSelect={(value) => setGuessInput(value)}
            options={filteredBands.map((band) => ({ value: band.name }))}
            placeholder="输入乐队名，例如：Radiohead / Queen / The Beatles"
            style={{ flex: 1, minWidth: 260 }}
            filterOption={(inputValue, option) =>
              option?.value?.toLowerCase().includes(inputValue.toLowerCase())
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submitGuess();
              }
              if (
                event.key === 'Tab' &&
                filteredBands.length > 0 &&
                !roundOver
              ) {
                event.preventDefault();
                submitGuess(filteredBands[0].name);
              }
            }}
            disabled={roundOver || bankSwitching}
          />
          <Button type="primary" size="large" icon={<RocketOutlined />} onClick={() => submitGuess()} disabled={roundOver || bankSwitching}>
            提交猜测
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={restartRound} disabled={!bands.length || bankSwitching}>
            {roundOver ? '下一题' : '换一题'}
          </Button>
        </div>

        {roundOver ? (
          <Card style={styles.answerCard}>
            <Space>
              <TrophyOutlined style={{ color: '#4CAF50' }} />
              <Text strong>
                {solved ? '猜中了！' : '本轮结束！'} 答案：{targetBand.name} | {targetBand.region} | {targetBand.genre} | {targetBand.yearFormed} |
                {' '}{targetBand.members}人 | {targetBand.status}
              </Text>
            </Space>
          </Card>
        ) : null}

        <Title level={4} style={styles.attemptsTitle}>
          最近猜测
        </Title>
        <div style={styles.board}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: '26%' }}>BAND</th>
                <th style={{ ...styles.th, width: '14%' }}>REGION</th>
                <th style={{ ...styles.th, width: '20%' }}>GENRE</th>
                <th style={{ ...styles.th, width: '12%' }}>YEAR</th>
                <th style={{ ...styles.th, width: '12%' }}>MEM</th>
                <th style={{ ...styles.th, width: '16%' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {attempts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...styles.tdBase, padding: '20px 10px', color: '#D2BCC8' }}>
                    还没有猜测，开始输入第一个乐队吧
                  </td>
                </tr>
              ) : (
                attempts.map((attempt) => (
                  <tr key={attempt.bandName}>
                    <td style={styles.tdBase}>{attempt.bandName}</td>
                    <td style={{ ...styles.tdBase, ...getCellStyle(attempt.region.state) }}>{attempt.region.value}</td>
                    <td style={{ ...styles.tdBase, ...getCellStyle(attempt.genre.state) }}>{attempt.genre.value}</td>
                    <td style={{ ...styles.tdBase, ...getCellStyle(attempt.year.state) }}>
                      {attempt.year.value} {attempt.year.arrow}
                    </td>
                    <td style={{ ...styles.tdBase, ...getCellStyle(attempt.members.state) }}>
                      {attempt.members.value} {attempt.members.arrow}
                    </td>
                    <td style={{ ...styles.tdBase, ...getCellStyle(attempt.status.state) }}>{attempt.status.value}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </Card>
        </div>

        <Card style={styles.sideCard}>
          <Title level={4} style={styles.sideTitle}>
            Tips
          </Title>
          <div style={{ display: 'grid', gap: 10 }}>
            <Tag color="success" style={{ width: 'fit-content' }}>快捷键</Tag>
            <Text style={styles.sideSubtitle}>
              按 Tab 键可快速选中并提交当前首个联想乐队。
            </Text>
            <Text style={styles.sideSubtitle}>
              猜测次数上限支持自定义，范围为 1-100 次（默认 10 次）。
            </Text>
            <Text style={styles.sideSubtitle}>
              登录后可在“管理自选题库”里创建 10-300 题的专属题库并分享链接。
            </Text>
            <Text style={styles.sideSubtitle}>
              Enter：提交当前输入
            </Text>
            <Text style={styles.sideSubtitle}>
              Esc：关闭联想下拉
            </Text>
            <Text style={styles.sideSubtitle}>
              左侧可按国家/地区筛选，点击名称可直接填入输入框。
            </Text>
            <Text style={styles.sideSubtitle}>
              中国地区请统一使用“华语”作为地区标识（例如筛选时输入“华语”）。
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GuessBand;
