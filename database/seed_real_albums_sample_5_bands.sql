USE music_review;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

START TRANSACTION;

-- 0) Ensure required genres exist
INSERT IGNORE INTO genres (name, description) VALUES
('Progressive Metal', '前卫金属'),
('Progressive Rock', '前卫摇滚'),
('Progressive Death Metal', '前卫死亡金属'),
('Thrash Metal', '激流金属'),
('Death Metal', '死亡金属'),
('Heavy Metal', '重金属'),
('Doom Metal', '厄运金属'),
('Metal', '金属'),
('Hard Rock', '硬摇滚');

-- 1) Real album metadata (sample batch: 5 bands x 2 albums)
DROP TEMPORARY TABLE IF EXISTS tmp_real_albums;
CREATE TEMPORARY TABLE tmp_real_albums (
  artist_name VARCHAR(100) COLLATE utf8mb4_unicode_ci,
  album_title VARCHAR(200) COLLATE utf8mb4_unicode_ci,
  release_year INT,
  primary_genre VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  secondary_genre VARCHAR(50) COLLATE utf8mb4_unicode_ci,
  description VARCHAR(1000),
  cover_url VARCHAR(255),
  PRIMARY KEY (artist_name, album_title)
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tmp_real_albums (
  artist_name, album_title, release_year, primary_genre, secondary_genre, description, cover_url
) VALUES
('Dream Theater', 'Images and Words', 1992, 'Progressive Metal', 'Progressive Rock',
 'Dream Theater 第二张录音室专辑，包含代表作 Pull Me Under，奠定乐队前卫金属与旋律并重的风格。', NULL),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 1999, 'Progressive Metal', 'Progressive Rock',
 'Dream Theater 经典概念专辑，以连贯叙事串联整张作品，被广泛视作前卫金属里程碑。', NULL),

('Opeth', 'Blackwater Park', 2001, 'Progressive Death Metal', 'Progressive Metal',
 'Opeth 代表专辑之一，结合死亡金属与前卫结构，制作人与编曲层次都极具标志性。', NULL),
('Opeth', 'Ghost Reveries', 2005, 'Progressive Death Metal', 'Progressive Metal',
 'Opeth 中后期重要作品，在极端与旋律之间取得高完成度平衡。', NULL),

('Metallica', 'Ride the Lightning', 1984, 'Thrash Metal', 'Metal',
 'Metallica 早期经典作品，编曲复杂度与旋律表达显著进阶。', NULL),
('Metallica', 'Master of Puppets', 1986, 'Thrash Metal', 'Metal',
 'Metallica 公认巅峰专辑之一，兼具攻击性与结构完整性。', NULL),

('Iron Maiden', 'The Number of the Beast', 1982, 'Heavy Metal', 'Metal',
 'Iron Maiden 经典时期代表作之一，兼具旋律性与速度感。', NULL),
('Iron Maiden', 'Powerslave', 1984, 'Heavy Metal', 'Metal',
 'Iron Maiden 80 年代黄金阶段作品，长篇叙事与舞台风格鲜明。', NULL),

('Black Sabbath', 'Paranoid', 1970, 'Heavy Metal', 'Doom Metal',
 'Black Sabbath 早期里程碑作品，奠定重金属核心语汇。', NULL),
('Black Sabbath', 'Master of Reality', 1971, 'Heavy Metal', 'Doom Metal',
 'Black Sabbath 经典重型时期专辑，低音调与沉重音色影响深远。', NULL);

-- 2) Real tracklists
DROP TEMPORARY TABLE IF EXISTS tmp_real_tracks;
CREATE TEMPORARY TABLE tmp_real_tracks (
  artist_name VARCHAR(100) COLLATE utf8mb4_unicode_ci,
  album_title VARCHAR(200) COLLATE utf8mb4_unicode_ci,
  track_number INT,
  track_title VARCHAR(200) COLLATE utf8mb4_unicode_ci,
  duration INT,
  PRIMARY KEY (artist_name, album_title, track_number)
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tmp_real_tracks (artist_name, album_title, track_number, track_title, duration) VALUES
-- Dream Theater - Images and Words
('Dream Theater', 'Images and Words', 1, 'Pull Me Under', 491),
('Dream Theater', 'Images and Words', 2, 'Another Day', 263),
('Dream Theater', 'Images and Words', 3, 'Take the Time', 488),
('Dream Theater', 'Images and Words', 4, 'Surrounded', 328),
('Dream Theater', 'Images and Words', 5, 'Metropolis--Part I: "The Miracle and the Sleeper"', 569),
('Dream Theater', 'Images and Words', 6, 'Under a Glass Moon', 445),
('Dream Theater', 'Images and Words', 7, 'Wait for Sleep', 166),
('Dream Theater', 'Images and Words', 8, 'Learning to Live', 690),

-- Dream Theater - Metropolis Pt. 2: Scenes from a Memory
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 1, 'Regression', 130),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 2, 'Overture 1928', 381),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 3, 'Strange Deja Vu', 328),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 4, 'Through My Words', 61),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 5, 'Fatal Tragedy', 396),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 6, 'Beyond This Life', 671),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 7, 'Through Her Eyes', 324),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 8, 'Home', 752),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 9, 'The Dance of Eternity', 375),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 10, 'One Last Time', 230),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 11, 'The Spirit Carries On', 404),
('Dream Theater', 'Metropolis Pt. 2: Scenes from a Memory', 12, 'Finally Free', 711),

-- Opeth - Blackwater Park
('Opeth', 'Blackwater Park', 1, 'The Leper Affinity', 623),
('Opeth', 'Blackwater Park', 2, 'Bleak', 555),
('Opeth', 'Blackwater Park', 3, 'Harvest', 379),
('Opeth', 'Blackwater Park', 4, 'The Drapery Falls', 634),
('Opeth', 'Blackwater Park', 5, 'Dirge for November', 469),
('Opeth', 'Blackwater Park', 6, 'The Funeral Portrait', 528),
('Opeth', 'Blackwater Park', 7, 'Patterns in the Ivy', 112),
('Opeth', 'Blackwater Park', 8, 'Blackwater Park', 732),

-- Opeth - Ghost Reveries
('Opeth', 'Ghost Reveries', 1, 'Ghost of Perdition', 626),
('Opeth', 'Ghost Reveries', 2, 'The Baying of the Hounds', 641),
('Opeth', 'Ghost Reveries', 3, 'Beneath the Mire', 457),
('Opeth', 'Ghost Reveries', 4, 'Atonement', 354),
('Opeth', 'Ghost Reveries', 5, 'Reverie/Harlequin Forest', 671),
('Opeth', 'Ghost Reveries', 6, 'Hours of Wealth', 321),
('Opeth', 'Ghost Reveries', 7, 'The Grand Conjuration', 636),
('Opeth', 'Ghost Reveries', 8, 'Isolation Years', 231),

-- Metallica - Ride the Lightning
('Metallica', 'Ride the Lightning', 1, 'Fight Fire with Fire', 284),
('Metallica', 'Ride the Lightning', 2, 'Ride the Lightning', 396),
('Metallica', 'Ride the Lightning', 3, 'For Whom the Bell Tolls', 310),
('Metallica', 'Ride the Lightning', 4, 'Fade to Black', 417),
('Metallica', 'Ride the Lightning', 5, 'Trapped Under Ice', 243),
('Metallica', 'Ride the Lightning', 6, 'Escape', 263),
('Metallica', 'Ride the Lightning', 7, 'Creeping Death', 396),
('Metallica', 'Ride the Lightning', 8, 'The Call of Ktulu', 534),

-- Metallica - Master of Puppets
('Metallica', 'Master of Puppets', 1, 'Battery', 312),
('Metallica', 'Master of Puppets', 2, 'Master of Puppets', 515),
('Metallica', 'Master of Puppets', 3, 'The Thing That Should Not Be', 396),
('Metallica', 'Master of Puppets', 4, 'Welcome Home (Sanitarium)', 390),
('Metallica', 'Master of Puppets', 5, 'Disposable Heroes', 496),
('Metallica', 'Master of Puppets', 6, 'Leper Messiah', 340),
('Metallica', 'Master of Puppets', 7, 'Orion', 508),
('Metallica', 'Master of Puppets', 8, 'Damage, Inc.', 330),

-- Iron Maiden - The Number of the Beast
('Iron Maiden', 'The Number of the Beast', 1, 'Invaders', 203),
('Iron Maiden', 'The Number of the Beast', 2, 'Children of the Damned', 275),
('Iron Maiden', 'The Number of the Beast', 3, 'The Prisoner', 362),
('Iron Maiden', 'The Number of the Beast', 4, '22 Acacia Avenue', 394),
('Iron Maiden', 'The Number of the Beast', 5, 'The Number of the Beast', 290),
('Iron Maiden', 'The Number of the Beast', 6, 'Run to the Hills', 230),
('Iron Maiden', 'The Number of the Beast', 7, 'Gangland', 227),
('Iron Maiden', 'The Number of the Beast', 8, 'Hallowed Be Thy Name', 431),

-- Iron Maiden - Powerslave
('Iron Maiden', 'Powerslave', 1, 'Aces High', 271),
('Iron Maiden', 'Powerslave', 2, '2 Minutes to Midnight', 360),
('Iron Maiden', 'Powerslave', 3, 'Losfer Words (Big ''Orra)', 252),
('Iron Maiden', 'Powerslave', 4, 'Flash of the Blade', 256),
('Iron Maiden', 'Powerslave', 5, 'The Duellists', 366),
('Iron Maiden', 'Powerslave', 6, 'Back in the Village', 323),
('Iron Maiden', 'Powerslave', 7, 'Powerslave', 408),
('Iron Maiden', 'Powerslave', 8, 'Rime of the Ancient Mariner', 816),

-- Black Sabbath - Paranoid
('Black Sabbath', 'Paranoid', 1, 'War Pigs', 470),
('Black Sabbath', 'Paranoid', 2, 'Paranoid', 170),
('Black Sabbath', 'Paranoid', 3, 'Planet Caravan', 269),
('Black Sabbath', 'Paranoid', 4, 'Iron Man', 356),
('Black Sabbath', 'Paranoid', 5, 'Electric Funeral', 292),
('Black Sabbath', 'Paranoid', 6, 'Hand of Doom', 431),
('Black Sabbath', 'Paranoid', 7, 'Rat Salad', 150),
('Black Sabbath', 'Paranoid', 8, 'Fairies Wear Boots', 375),

-- Black Sabbath - Master of Reality
('Black Sabbath', 'Master of Reality', 1, 'Sweet Leaf', 305),
('Black Sabbath', 'Master of Reality', 2, 'After Forever', 311),
('Black Sabbath', 'Master of Reality', 3, 'Embryo', 28),
('Black Sabbath', 'Master of Reality', 4, 'Children of the Grave', 308),
('Black Sabbath', 'Master of Reality', 5, 'Orchid', 92),
('Black Sabbath', 'Master of Reality', 6, 'Lord of This World', 325),
('Black Sabbath', 'Master of Reality', 7, 'Solitude', 348),
('Black Sabbath', 'Master of Reality', 8, 'Into the Void', 368);

-- 2.1) 仅对“当前没有专辑”的艺术家生效，避免与现有专辑冲突
DROP TEMPORARY TABLE IF EXISTS tmp_seed_scope_artists;
CREATE TEMPORARY TABLE tmp_seed_scope_artists (
  artist_id BIGINT PRIMARY KEY,
  artist_name VARCHAR(100) COLLATE utf8mb4_unicode_ci
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tmp_seed_scope_artists (artist_id, artist_name)
SELECT
  a.id,
  a.name
FROM artists a
JOIN (
  SELECT DISTINCT artist_name FROM tmp_real_albums
) ra ON ra.artist_name COLLATE utf8mb4_unicode_ci = a.name COLLATE utf8mb4_unicode_ci
LEFT JOIN albums al ON al.artist_id = a.id
GROUP BY a.id, a.name
HAVING COUNT(al.id) = 0;

-- 3) Insert albums (idempotent, scoped)
INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by)
SELECT
  ra.album_title,
  CASE
    WHEN UPPER(LEFT(ra.album_title, 1)) REGEXP '[A-Z]' THEN UPPER(LEFT(ra.album_title, 1))
    ELSE '#'
  END AS title_initial,
  ssa.artist_id AS artist_id,
  ra.release_year,
  ra.cover_url,
  ra.description,
  NULL AS created_by
FROM tmp_real_albums ra
JOIN tmp_seed_scope_artists ssa
  ON ssa.artist_name COLLATE utf8mb4_unicode_ci = ra.artist_name COLLATE utf8mb4_unicode_ci
LEFT JOIN albums al
  ON al.artist_id = ssa.artist_id
 AND al.title COLLATE utf8mb4_unicode_ci = ra.album_title COLLATE utf8mb4_unicode_ci
WHERE al.id IS NULL;

-- 4) Resolve album ids for subsequent inserts
DROP TEMPORARY TABLE IF EXISTS tmp_real_album_ids;
CREATE TEMPORARY TABLE tmp_real_album_ids (
  album_id BIGINT PRIMARY KEY,
  artist_name VARCHAR(100) COLLATE utf8mb4_unicode_ci,
  album_title VARCHAR(200) COLLATE utf8mb4_unicode_ci
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO tmp_real_album_ids (album_id, artist_name, album_title)
SELECT
  al.id,
  ra.artist_name,
  ra.album_title
FROM tmp_real_albums ra
JOIN tmp_seed_scope_artists ssa
  ON ssa.artist_name COLLATE utf8mb4_unicode_ci = ra.artist_name COLLATE utf8mb4_unicode_ci
JOIN albums al
  ON al.artist_id = ssa.artist_id
 AND al.title COLLATE utf8mb4_unicode_ci = ra.album_title COLLATE utf8mb4_unicode_ci;

-- 5) Insert tracks (idempotent by album_id + track_number)
INSERT INTO tracks (album_id, track_number, title, duration)
SELECT
  rid.album_id,
  rt.track_number,
  rt.track_title,
  rt.duration
FROM tmp_real_tracks rt
JOIN tmp_real_album_ids rid
  ON rid.artist_name COLLATE utf8mb4_unicode_ci = rt.artist_name COLLATE utf8mb4_unicode_ci
 AND rid.album_title COLLATE utf8mb4_unicode_ci = rt.album_title COLLATE utf8mb4_unicode_ci
LEFT JOIN tracks t
  ON t.album_id = rid.album_id
 AND t.track_number = rt.track_number
WHERE t.id IS NULL;

-- 6) Insert primary genres
INSERT INTO album_genres (album_id, genre_id)
SELECT
  rid.album_id,
  g.id
FROM tmp_real_album_ids rid
JOIN tmp_real_albums ra
  ON ra.artist_name COLLATE utf8mb4_unicode_ci = rid.artist_name COLLATE utf8mb4_unicode_ci
 AND ra.album_title COLLATE utf8mb4_unicode_ci = rid.album_title COLLATE utf8mb4_unicode_ci
JOIN genres g
  ON g.name COLLATE utf8mb4_unicode_ci = ra.primary_genre COLLATE utf8mb4_unicode_ci
LEFT JOIN album_genres ag
  ON ag.album_id = rid.album_id
 AND ag.genre_id = g.id
WHERE ag.album_id IS NULL;

-- 7) Insert secondary genres
INSERT INTO album_genres (album_id, genre_id)
SELECT
  rid.album_id,
  g.id
FROM tmp_real_album_ids rid
JOIN tmp_real_albums ra
  ON ra.artist_name COLLATE utf8mb4_unicode_ci = rid.artist_name COLLATE utf8mb4_unicode_ci
 AND ra.album_title COLLATE utf8mb4_unicode_ci = rid.album_title COLLATE utf8mb4_unicode_ci
JOIN genres g
  ON g.name COLLATE utf8mb4_unicode_ci = ra.secondary_genre COLLATE utf8mb4_unicode_ci
LEFT JOIN album_genres ag
  ON ag.album_id = rid.album_id
 AND ag.genre_id = g.id
WHERE ra.secondary_genre IS NOT NULL
  AND ag.album_id IS NULL;

COMMIT;

-- 8) Preview
SELECT COUNT(*) AS scoped_artists_count
FROM tmp_seed_scope_artists;

SELECT
  a.name AS artist_name,
  al.title,
  al.release_year,
  GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ', ') AS genres,
  COUNT(DISTINCT t.id) AS track_count
FROM tmp_real_album_ids rid
JOIN albums al ON al.id = rid.album_id
JOIN artists a ON a.id = al.artist_id
LEFT JOIN album_genres ag ON ag.album_id = al.id
LEFT JOIN genres g ON g.id = ag.genre_id
LEFT JOIN tracks t ON t.album_id = al.id
GROUP BY a.name, al.id, al.title, al.release_year
ORDER BY a.name, al.release_year;
