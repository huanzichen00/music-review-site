USE music_review;

-- 删除在 artists.genre 中没有对应乐队的风格
DELETE g
FROM genres g
LEFT JOIN artists a ON TRIM(a.genre) = g.name
WHERE a.id IS NULL;

-- 校验：应为 0
SELECT COUNT(*) AS orphan_genres
FROM genres g
LEFT JOIN artists a ON TRIM(a.genre) = g.name
WHERE a.id IS NULL;
