USE music_review;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

START TRANSACTION;

-- 1) 预览疑似重复（同乐队 + 同标题，忽略大小写与首尾空格）
SELECT
  ar.name AS artist_name,
  al.title,
  COUNT(*) AS duplicate_count,
  GROUP_CONCAT(al.id ORDER BY al.id) AS album_ids
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
GROUP BY ar.id, LOWER(TRIM(al.title))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, artist_name, al.title;

-- 1.1) 仅检查你截图提到的专辑是否重复
SELECT
  ar.name AS artist_name,
  al.title,
  al.release_year,
  al.id
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
WHERE (ar.name, al.title) IN (
  ('Dream Theater', 'Images and Words'),
  ('Opeth', 'Blackwater Park'),
  ('The Beatles', 'Let It Be'),
  ('Oasis', '(What''s the Story) Morning Glory?'),
  ('Porcupine Tree', 'Fear of a Blank Planet')
)
ORDER BY ar.name, al.title, al.id;

-- 2) 优先删除“自动补全资料”且与同名专辑冲突的记录
--    （保留真实专辑或更早插入的一条）
DELETE al_auto
FROM albums al_auto
JOIN albums al_other
  ON al_auto.artist_id = al_other.artist_id
 AND LOWER(TRIM(al_auto.title)) = LOWER(TRIM(al_other.title))
 AND al_auto.id <> al_other.id
WHERE al_auto.description LIKE '【自动补全资料】%'
  AND (
    al_other.description NOT LIKE '【自动补全资料】%'
    OR al_other.id < al_auto.id
  );

-- 3) 通用去重：同乐队 + 同标题仅保留最小 id（最早一条）
--    注意：若你有“同名不同版本”专辑，这步也会去重；如需保留请先注释。
DELETE al_dup
FROM albums al_dup
JOIN albums al_keep
  ON al_dup.artist_id = al_keep.artist_id
 AND LOWER(TRIM(al_dup.title)) = LOWER(TRIM(al_keep.title))
 AND al_dup.id > al_keep.id;

COMMIT;

-- 4) 清理后复查（应尽量为 0 行）
SELECT
  ar.name AS artist_name,
  al.title,
  COUNT(*) AS duplicate_count,
  GROUP_CONCAT(al.id ORDER BY al.id) AS album_ids
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
GROUP BY ar.id, LOWER(TRIM(al.title))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, artist_name, al.title;
