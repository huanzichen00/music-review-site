USE music_review;

-- 1) 将 artists.genre 中存在但 genres 表缺失的风格补入 genres
INSERT INTO genres (name, description)
SELECT DISTINCT
    TRIM(a.genre) AS name,
    CONCAT('同步自 artists.genre: ', TRIM(a.genre)) AS description
FROM artists a
LEFT JOIN genres g ON g.name = TRIM(a.genre)
WHERE a.genre IS NOT NULL
  AND TRIM(a.genre) <> ''
  AND g.id IS NULL;

-- 2) 将专辑按其艺术家的 genre 自动补齐到 album_genres（避免风格页与猜乐队脱节）
INSERT INTO album_genres (album_id, genre_id)
SELECT
    al.id AS album_id,
    g.id AS genre_id
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
JOIN genres g ON g.name = TRIM(ar.genre)
LEFT JOIN album_genres ag ON ag.album_id = al.id AND ag.genre_id = g.id
WHERE ar.genre IS NOT NULL
  AND TRIM(ar.genre) <> ''
  AND ag.album_id IS NULL;

-- 3) 校验输出
SELECT COUNT(*) AS genres_count FROM genres;
SELECT COUNT(*) AS album_genre_links_count FROM album_genres;
