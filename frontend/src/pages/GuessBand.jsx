import { useMemo, useState } from 'react';
import { AutoComplete, Button, Card, List, Space, Tag, Typography, message } from 'antd';
import { TrophyOutlined, ReloadOutlined, RocketOutlined } from '@ant-design/icons';
import { BAND_POOL } from '../data/bands';

const { Title, Text } = Typography;

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
};

const pickRandomBand = (excludeBand = null) => {
  if (BAND_POOL.length <= 1) {
    return BAND_POOL[0];
  }
  const filtered = excludeBand ? BAND_POOL.filter((band) => band !== excludeBand) : BAND_POOL;
  return filtered[Math.floor(Math.random() * filtered.length)];
};

const normalizeBand = (value) => value.trim().toLowerCase();

const GuessBand = () => {
  const [targetBand, setTargetBand] = useState(() => pickRandomBand());
  const [guessInput, setGuessInput] = useState('');
  const [attempts, setAttempts] = useState([]);
  const [solved, setSolved] = useState(false);

  const filteredBands = useMemo(() => {
    const keyword = normalizeBand(guessInput);
    if (!keyword) {
      return BAND_POOL.slice(0, 10);
    }
    return BAND_POOL
      .filter((band) => normalizeBand(band).includes(keyword))
      .slice(0, 10);
  }, [guessInput]);

  const restartRound = () => {
    setTargetBand((prev) => pickRandomBand(prev));
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

    const normalizedInput = normalizeBand(guessInput);
    const matchedBand = BAND_POOL.find((band) => normalizeBand(band) === normalizedInput);

    if (!matchedBand) {
      message.warning('请从乐队库里选择一个名字（可参考下方联想）');
      return;
    }

    const duplicated = attempts.some((attempt) => normalizeBand(attempt.name) === normalizedInput);
    if (duplicated) {
      message.warning('这个乐队你已经猜过了');
      return;
    }

    const isCorrect = normalizeBand(targetBand) === normalizedInput;
    const nextAttempts = [...attempts, { name: matchedBand, correct: isCorrect }];
    setAttempts(nextAttempts);
    setGuessInput('');

    if (isCorrect) {
      setSolved(true);
      message.success(`猜中了！答案是 ${targetBand}`);
    }
  };

  return (
    <div style={styles.wrapper}>
      <Card style={styles.heroCard}>
        <Space size="middle" wrap>
          <Tag color="success">无限模式</Tag>
          <Tag color="gold">乐队库 {BAND_POOL.length} 支</Tag>
          <Text strong>本轮尝试 {attempts.length} 次</Text>
        </Space>

        <Title level={1} style={styles.title}>
          猜乐队
        </Title>
        <Text style={styles.subtitle}>
          输入你猜的乐队名并提交。猜中后可立即开始下一题。
        </Text>

        <div style={styles.actionRow}>
          <AutoComplete
            size="large"
            value={guessInput}
            onChange={(value) => setGuessInput(value)}
            onSelect={(value) => setGuessInput(value)}
            options={filteredBands.map((band) => ({ value: band }))}
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
          <Button size="large" icon={<ReloadOutlined />} onClick={restartRound}>
            {solved ? '下一题' : '换一题'}
          </Button>
        </div>

        {solved ? (
          <Card
            style={{
              marginTop: 18,
              borderRadius: 12,
              border: '1px solid #C8E6C9',
              background: 'linear-gradient(180deg, #F6FFF4 0%, #EEFAEA 100%)',
            }}
          >
            <Space>
              <TrophyOutlined style={{ color: '#4CAF50' }} />
              <Text strong>答对了：{targetBand}</Text>
            </Space>
          </Card>
        ) : null}

        <Title level={4} style={styles.attemptsTitle}>
          联想乐队
        </Title>
        <Space wrap>
          {filteredBands.map((band) => (
            <Tag
              key={band}
              color="processing"
              style={{ cursor: 'pointer', marginBottom: 8 }}
              onClick={() => setGuessInput(band)}
            >
              {band}
            </Tag>
          ))}
        </Space>

        <Title level={4} style={styles.attemptsTitle}>
          最近猜测
        </Title>
        <List
          bordered
          dataSource={attempts}
          locale={{ emptyText: '还没有猜测，开始输入第一个乐队吧' }}
          renderItem={(attempt) => (
            <List.Item
              actions={[
                attempt.correct
                  ? <Tag color="success" key={`${attempt.name}-correct`}>猜中</Tag>
                  : <Tag color="error" key={`${attempt.name}-wrong`}>未猜中</Tag>,
              ]}
            >
              <Text>{attempt.name}</Text>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export default GuessBand;
