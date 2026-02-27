USE music_review;

-- 目标：补齐猜乐队需要的 26 支乐队元数据
-- 规则：
-- 1) 若 artists 里缺少某乐队，则自动创建
-- 2) 已存在乐队则更新字段
-- 3) 不修改 description / photo_url

DROP TEMPORARY TABLE IF EXISTS tmp_artist_game_metadata;

CREATE TEMPORARY TABLE tmp_artist_game_metadata (
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NULL,
    formed_year INT NULL,
    genre VARCHAR(80) NULL,
    member_count INT NULL,
    status VARCHAR(20) NULL
);

INSERT INTO tmp_artist_game_metadata (name, country, formed_year, genre, member_count, status) VALUES
('Dream Theater', 'US', 1985, 'Progressive Metal', 5, '活跃'),
('The Beatles', 'UK', 1960, 'Rock', 4, '解散'),
('The Rolling Stones', 'UK', 1962, 'Rock', 4, '活跃'),
('Pink Floyd', 'UK', 1965, 'Progressive Rock', 4, '解散'),
('Queen', 'UK', 1970, 'Rock', 4, '活跃'),
('Led Zeppelin', 'UK', 1968, 'Hard Rock', 4, '解散'),
('Nirvana', 'US', 1987, 'Grunge', 3, '解散'),
('Radiohead', 'UK', 1985, 'Alternative Rock', 5, '活跃'),
('Oasis', 'UK', 1991, 'Britpop', 5, '解散'),
('U2', 'Ireland', 1976, 'Rock', 4, '活跃'),
('Metallica', 'US', 1981, 'Metal', 4, '活跃'),
('Iron Maiden', 'UK', 1975, 'Metal', 6, '活跃'),
('Black Sabbath', 'UK', 1968, 'Metal', 4, '解散'),
('AC/DC', 'Australia', 1973, 'Hard Rock', 5, '活跃'),
('Guns N'' Roses', 'US', 1985, 'Hard Rock', 6, '活跃'),
('Green Day', 'US', 1987, 'Punk Rock', 3, '活跃'),
('Blink-182', 'US', 1992, 'Pop Punk', 3, '活跃'),
('Red Hot Chili Peppers', 'US', 1982, 'Funk Rock', 4, '活跃'),
('My Chemical Romance', 'US', 2001, 'Alternative Rock', 4, '活跃'),
('Bon Jovi', 'US', 1983, 'Hard Rock', 5, '活跃'),
('Eagles', 'US', 1971, 'Rock', 5, '活跃'),
('The Police', 'UK', 1977, 'Rock', 3, '解散'),
('Scorpions', 'Germany', 1965, 'Hard Rock', 5, '活跃'),
('Deep Purple', 'UK', 1968, 'Hard Rock', 5, '活跃'),
('Journey', 'US', 1973, 'Rock', 5, '活跃'),
('X Japan', 'Japan', 1982, 'Metal', 5, '活跃');

-- 插入缺失乐队（避免仅更新已存在数据）
INSERT INTO artists (name, name_initial, country, formed_year, genre, member_count, status)
SELECT
    t.name,
    CASE
        WHEN UPPER(LEFT(t.name, 1)) REGEXP '^[A-Z]$' THEN UPPER(LEFT(t.name, 1))
        ELSE '#'
    END AS name_initial,
    t.country,
    t.formed_year,
    t.genre,
    t.member_count,
    t.status
FROM tmp_artist_game_metadata t
LEFT JOIN artists a ON a.name = t.name
WHERE a.id IS NULL;

-- 统一更新目标乐队字段（不修改 description / photo_url）
UPDATE artists a
JOIN tmp_artist_game_metadata t ON a.name = t.name
SET
    a.country = t.country,
    a.formed_year = t.formed_year,
    a.genre = t.genre,
    a.member_count = t.member_count,
    a.status = t.status;

-- 校验：应返回 26 条
SELECT name, country, formed_year, genre, member_count, status
FROM artists
WHERE name IN (SELECT name FROM tmp_artist_game_metadata)
ORDER BY name;

DROP TEMPORARY TABLE IF EXISTS tmp_artist_game_metadata;
