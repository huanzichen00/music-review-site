import { useEffect, useMemo, useState } from 'react';
import { Alert, AutoComplete, Button, Card, Space, Spin, Tag, Typography, message } from 'antd';
import { TrophyOutlined, ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import { artistsApi } from '../api/artists';

const { Title, Text } = Typography;
const ALLOWED_BAND_NAMES = new Set([
  'Dream Theater',
  'The Beatles',
  'The Rolling Stones',
  'Pink Floyd',
  'Queen',
  'Led Zeppelin',
  'Nirvana',
  'Radiohead',
  'Oasis',
  'U2',
  'Metallica',
  'Iron Maiden',
  'Black Sabbath',
  'AC/DC',
  'Guns N\' Roses',
  'Green Day',
  'Blink-182',
  'Red Hot Chili Peppers',
  'My Chemical Romance',
  'Bon Jovi',
  'Eagles',
  'The Police',
  'Scorpions',
  'Deep Purple',
  'Journey',
  'X Japan',
]);

const styles = {
  wrapper: {
    maxWidth: 980,
    margin: '0 auto',
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
  subtitle: {
    color: '#7C5A4E',
    fontSize: 16,
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

const GuessBand = () => {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetBand, setTargetBand] = useState(null);
  const [guessInput, setGuessInput] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    const loadBands = async () => {
      setLoading(true);
      try {
        const response = await artistsApi.getAll();
        const allArtists = response.data || [];
        const gameBands = allArtists
          .filter((artist) =>
            ALLOWED_BAND_NAMES.has((artist?.name || '').trim()) &&
            artist?.name &&
            artist?.country &&
            artist?.formedYear &&
            artist?.genre &&
            artist?.memberCount &&
            artist?.status
          )
          .map((artist) => ({
            name: artist.name.trim(),
            region: artist.country.trim(),
            genre: artist.genre.trim(),
            yearFormed: artist.formedYear,
            members: artist.memberCount,
            status: artist.status.trim(),
          }));

        setBands(gameBands);
        setTargetBand(pickRandomBand(gameBands));
      } catch {
        message.error('加载乐队数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadBands();
  }, []);

  const filteredBands = useMemo(() => {
    const keyword = normalizeBand(guessInput);
    if (!keyword) {
      return bands.slice(0, 10);
    }
    return bands
      .filter((band) => normalizeBand(band.name).includes(keyword))
      .slice(0, 10);
  }, [bands, guessInput]);

  const restartRound = () => {
    setTargetBand((prev) => pickRandomBand(bands, prev));
    setGuessInput('');
    setAttempts([]);
    setSolved(false);
  };

  const submitGuess = () => {
    if (!guessInput.trim()) {
      message.warning('先输入一个乐队名');
      return;
    }
    if (solved) {
      message.info('这一轮已经猜中，点击“下一题”开始新一轮');
      return;
    }
    if (!targetBand) {
      message.warning('乐队题库未就绪');
      return;
    }

    const normalizedInput = normalizeBand(guessInput);
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
      message.success(`猜中了！答案是 ${targetBand.name}`);
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
      <Card style={styles.heroCard}>
        <Space size="middle" wrap>
          <Tag color="success">无限模式</Tag>
          <Tag color="gold">乐队库 {bands.length} 支</Tag>
          <Text strong>本轮尝试 {attempts.length} 次</Text>
        </Space>

        <Title level={1} style={styles.title}>
          猜乐队
        </Title>
        <Text style={styles.subtitle}>
          题库数据统一来自后端艺术家接口。输入你猜的乐队名并提交，猜中后可立即开始下一题。
        </Text>

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
            placeholder="输入乐队名，例如：Radiohead / 五月天 / 告五人"
            style={{ flex: 1, minWidth: 260 }}
            filterOption={(inputValue, option) =>
              option?.value?.toLowerCase().includes(inputValue.toLowerCase())
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                submitGuess();
              }
            }}
          />
          <Button type="primary" size="large" icon={<RocketOutlined />} onClick={submitGuess}>
            提交猜测
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={restartRound} disabled={!bands.length}>
            {solved ? '下一题' : '换一题'}
          </Button>
        </div>

        {solved ? (
          <Card style={styles.answerCard}>
            <Space>
              <TrophyOutlined style={{ color: '#4CAF50' }} />
              <Text strong>
                答案：{targetBand.name} | {targetBand.region} | {targetBand.genre} | {targetBand.yearFormed} |
                {' '}{targetBand.members}人 | {targetBand.status}
              </Text>
            </Space>
          </Card>
        ) : null}

        <Title level={4} style={styles.attemptsTitle}>
          联想乐队
        </Title>
        <Space wrap>
          {filteredBands.map((band) => (
            <Tag
              key={band.name}
              color="processing"
              style={{ cursor: 'pointer', marginBottom: 8 }}
              onClick={() => setGuessInput(band.name)}
            >
              {band.name}
            </Tag>
          ))}
        </Space>

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
  );
};

export default GuessBand;
