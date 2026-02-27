USE music_review;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

START TRANSACTION;

-- 0) 保障常用风格存在，供 album_genres 关联使用
INSERT IGNORE INTO genres (name, description) VALUES
('Rock', '摇滚'),
('Hard Rock', '硬摇滚'),
('Alternative Rock', '另类摇滚'),
('Indie Rock', '独立摇滚'),
('Progressive Rock', '前卫摇滚'),
('Metal', '金属'),
('Thrash Metal', '激流金属'),
('Death Metal', '死亡金属'),
('Black Metal', '黑金属'),
('Progressive Metal', '前卫金属'),
('Power Metal', '力量金属'),
('Industrial Metal', '工业金属'),
('Melodic Death Metal', '旋律死亡金属'),
('Grindcore', '碾核'),
('Punk Rock', '朋克摇滚'),
('Pop Rock', '流行摇滚'),
('New Wave', '新浪潮'),
('Shoegaze', '盯鞋'),
('Grunge', '垃圾摇滚'),
('Blues Rock', '蓝调摇滚'),
('Southern Rock', '南方摇滚'),
('Folk Rock', '民谣摇滚'),
('Britpop', '英伦流行');

-- 1) 找出当前没有任何专辑的乐队
DROP TEMPORARY TABLE IF EXISTS tmp_artists_without_albums;
CREATE TEMPORARY TABLE tmp_artists_without_albums (
  artist_id BIGINT PRIMARY KEY,
  artist_name VARCHAR(100) COLLATE utf8mb4_unicode_ci,
  formed_year INT,
  country VARCHAR(50),
  artist_genre VARCHAR(80)
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tmp_artists_without_albums (artist_id, artist_name, formed_year, country, artist_genre)
SELECT
  a.id,
  a.name,
  a.formed_year,
  a.country,
  a.genre
FROM artists a
LEFT JOIN albums al ON al.artist_id = a.id
WHERE al.id IS NULL;

-- 2) 为每位乐队准备两张专辑的种子数据
DROP TEMPORARY TABLE IF EXISTS tmp_seed_album_rows;
CREATE TEMPORARY TABLE tmp_seed_album_rows (
  artist_id BIGINT,
  artist_name VARCHAR(100) COLLATE utf8mb4_unicode_ci,
  album_seq INT,
  title VARCHAR(200) COLLATE utf8mb4_unicode_ci,
  title_initial CHAR(1),
  release_year INT,
  cover_url VARCHAR(255),
  description TEXT,
  primary_genre VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  secondary_genre VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (artist_id, album_seq)
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tmp_seed_album_rows (
  artist_id, artist_name, album_seq, title, title_initial, release_year, cover_url, description, primary_genre, secondary_genre
)
SELECT
  t.artist_id,
  t.artist_name,
  s.seq AS album_seq,
  CONCAT(t.artist_name, CASE WHEN s.seq = 1 THEN ' Origins' ELSE ' Horizons' END) AS title,
  CASE
    WHEN UPPER(LEFT(t.artist_name, 1)) REGEXP '[A-Z]' THEN UPPER(LEFT(t.artist_name, 1))
    ELSE '#'
  END AS title_initial,
  LEAST(
    COALESCE(NULLIF(t.formed_year, 0), 2000) + CASE WHEN s.seq = 1 THEN 2 ELSE 6 END,
    YEAR(CURDATE()) - 1
  ) AS release_year,
  CONCAT('https://picsum.photos/seed/music-review-', t.artist_id, '-', s.seq, '/600/600') AS cover_url,
  CONCAT(
    '【自动补全资料】', t.artist_name, ' 的第 ', s.seq, ' 张站内资料专辑。风格：',
    COALESCE(t.artist_genre, 'Rock'),
    '；地区：', COALESCE(t.country, '未知'),
    '；包含 8 首曲目，用于丰富站内专辑、收藏与评论数据。'
  ) AS description,
  CASE
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%blackened%death%' THEN 'Death Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%melodic%death%' THEN 'Melodic Death Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%thrash%' THEN 'Thrash Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%death%' THEN 'Death Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%black%' THEN 'Black Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%power%' THEN 'Power Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%progressive%metal%' THEN 'Progressive Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%progressive%rock%' THEN 'Progressive Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%industrial%' THEN 'Industrial Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%grind%' THEN 'Grindcore'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%hard rock%' THEN 'Hard Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%alternative%' THEN 'Alternative Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%indie%' THEN 'Indie Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%punk%' THEN 'Punk Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%new wave%' THEN 'New Wave'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%shoegaze%' THEN 'Shoegaze'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%grunge%' THEN 'Grunge'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%blues%' THEN 'Blues Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%southern%' THEN 'Southern Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%folk%' THEN 'Folk Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%britpop%' THEN 'Britpop'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%pop rock%' THEN 'Pop Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%metal%' THEN 'Metal'
    ELSE 'Rock'
  END AS primary_genre,
  CASE
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%metal%' THEN 'Metal'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%rock%' THEN 'Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%punk%' THEN 'Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%new wave%' THEN 'Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%shoegaze%' THEN 'Alternative Rock'
    WHEN LOWER(COALESCE(t.artist_genre, '')) LIKE '%indie%' THEN 'Alternative Rock'
    ELSE NULL
  END AS secondary_genre
FROM tmp_artists_without_albums t
JOIN (
  SELECT 1 AS seq
  UNION ALL
  SELECT 2 AS seq
) s;

-- 3) 插入两张专辑（可重复执行，不重复插入）
INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by)
SELECT
  s.title, s.title_initial, s.artist_id, s.release_year, s.cover_url, s.description, NULL
FROM tmp_seed_album_rows s
LEFT JOIN albums a
  ON a.artist_id = s.artist_id
 AND a.title COLLATE utf8mb4_unicode_ci = s.title COLLATE utf8mb4_unicode_ci
WHERE a.id IS NULL;

-- 4) 找到刚才这些专辑的ID，用于补曲目与风格
DROP TEMPORARY TABLE IF EXISTS tmp_seeded_albums;
CREATE TEMPORARY TABLE tmp_seeded_albums (
  album_id BIGINT PRIMARY KEY,
  artist_id BIGINT,
  artist_name VARCHAR(100) COLLATE utf8mb4_unicode_ci,
  album_seq INT,
  primary_genre VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  secondary_genre VARCHAR(50) COLLATE utf8mb4_unicode_ci
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tmp_seeded_albums (album_id, artist_id, artist_name, album_seq, primary_genre, secondary_genre)
SELECT
  a.id,
  s.artist_id,
  s.artist_name,
  s.album_seq,
  s.primary_genre,
  s.secondary_genre
FROM albums a
JOIN tmp_seed_album_rows s
  ON a.artist_id = s.artist_id
 AND a.title COLLATE utf8mb4_unicode_ci = s.title COLLATE utf8mb4_unicode_ci;

-- 5) 曲目模板（每张专辑 8 首）
DROP TEMPORARY TABLE IF EXISTS tmp_track_template;
CREATE TEMPORARY TABLE tmp_track_template (
  track_number INT PRIMARY KEY,
  title_a VARCHAR(120),
  title_b VARCHAR(120),
  base_duration INT
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4;

INSERT INTO tmp_track_template (track_number, title_a, title_b, base_duration) VALUES
(1, 'Opening Pulse', 'Night Transit', 208),
(2, 'Broken Mirror', 'Silver Lines', 224),
(3, 'City of Echoes', 'Dark Horizon', 241),
(4, 'Gravity Shift', 'Midnight Engine', 257),
(5, 'Cold Fire', 'Parallel Hearts', 233),
(6, 'Quiet Riot', 'Signal & Noise', 246),
(7, 'Final Voltage', 'Afterimage', 269),
(8, 'Last Light', 'Beyond the Line', 286);

-- 6) 插入曲目（若该专辑已存在曲目则跳过）
INSERT INTO tracks (album_id, track_number, title, duration)
SELECT
  sa.album_id,
  tt.track_number,
  CASE
    WHEN sa.album_seq = 1 THEN tt.title_a
    ELSE tt.title_b
  END AS title,
  tt.base_duration + (sa.artist_id % 37) + (sa.album_seq * 5) AS duration
FROM tmp_seeded_albums sa
JOIN tmp_track_template tt
LEFT JOIN tracks tr
  ON tr.album_id = sa.album_id
 AND tr.track_number = tt.track_number
WHERE tr.id IS NULL;

-- 7) 绑定主风格
INSERT INTO album_genres (album_id, genre_id)
SELECT
  sa.album_id,
  g.id
FROM tmp_seeded_albums sa
JOIN genres g
  ON g.name COLLATE utf8mb4_unicode_ci = sa.primary_genre COLLATE utf8mb4_unicode_ci
LEFT JOIN album_genres ag
  ON ag.album_id = sa.album_id
 AND ag.genre_id = g.id
WHERE ag.album_id IS NULL;

-- 8) 绑定次风格（可选）
INSERT INTO album_genres (album_id, genre_id)
SELECT
  sa.album_id,
  g.id
FROM tmp_seeded_albums sa
JOIN genres g
  ON g.name COLLATE utf8mb4_unicode_ci = sa.secondary_genre COLLATE utf8mb4_unicode_ci
LEFT JOIN album_genres ag
  ON ag.album_id = sa.album_id
 AND ag.genre_id = g.id
WHERE sa.secondary_genre IS NOT NULL
  AND ag.album_id IS NULL;

COMMIT;

-- 9) 结果预览
SELECT
  COUNT(*) AS artists_seeded
FROM tmp_artists_without_albums;

SELECT
  a.name AS artist_name,
  al.title,
  al.release_year,
  GROUP_CONCAT(g.name ORDER BY g.name SEPARATOR ', ') AS genres,
  COUNT(t.id) AS track_count
FROM albums al
JOIN artists a ON a.id = al.artist_id
LEFT JOIN album_genres ag ON ag.album_id = al.id
LEFT JOIN genres g ON g.id = ag.genre_id
LEFT JOIN tracks t ON t.album_id = al.id
WHERE EXISTS (
  SELECT 1
  FROM tmp_artists_without_albums ta
  WHERE ta.artist_id = a.id
)
GROUP BY a.name, al.id, al.title, al.release_year
ORDER BY a.name, al.release_year;
