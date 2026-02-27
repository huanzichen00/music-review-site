USE music_review;

START TRANSACTION;

DROP TEMPORARY TABLE IF EXISTS tmp_album_dup_map;
CREATE TEMPORARY TABLE tmp_album_dup_map (
  dup_id BIGINT PRIMARY KEY,
  keep_id BIGINT NOT NULL
);

INSERT INTO tmp_album_dup_map (dup_id, keep_id)
SELECT al.id AS dup_id, g.keep_id
FROM albums al
JOIN (
  SELECT
    artist_id,
    LOWER(TRIM(title)) AS norm_title,
    MIN(id) AS keep_id,
    COUNT(*) AS cnt
  FROM albums
  GROUP BY artist_id, LOWER(TRIM(title))
  HAVING COUNT(*) > 1
) g
  ON g.artist_id = al.artist_id
 AND g.norm_title = LOWER(TRIM(al.title))
WHERE al.id <> g.keep_id;

-- Move reviews (avoid unique conflict on user_id + album_id)
DELETE r
FROM reviews r
JOIN tmp_album_dup_map m ON r.album_id = m.dup_id
JOIN reviews rk
  ON rk.album_id = m.keep_id
 AND rk.user_id = r.user_id;

UPDATE reviews r
JOIN tmp_album_dup_map m ON r.album_id = m.dup_id
SET r.album_id = m.keep_id;

-- Move favorites (avoid unique conflict on user_id + album_id)
DELETE f
FROM favorites f
JOIN tmp_album_dup_map m ON f.album_id = m.dup_id
JOIN favorites fk
  ON fk.album_id = m.keep_id
 AND fk.user_id = f.user_id;

UPDATE favorites f
JOIN tmp_album_dup_map m ON f.album_id = m.dup_id
SET f.album_id = m.keep_id;

-- Move blog post links
UPDATE blog_posts b
JOIN tmp_album_dup_map m ON b.album_id = m.dup_id
SET b.album_id = m.keep_id;

-- Move album_genres safely
INSERT INTO album_genres (album_id, genre_id)
SELECT DISTINCT m.keep_id, ag.genre_id
FROM album_genres ag
JOIN tmp_album_dup_map m ON ag.album_id = m.dup_id
LEFT JOIN album_genres agk
  ON agk.album_id = m.keep_id
 AND agk.genre_id = ag.genre_id
WHERE agk.album_id IS NULL;

DELETE ag
FROM album_genres ag
JOIN tmp_album_dup_map m ON ag.album_id = m.dup_id;

-- Move tracks safely (track_number + title + duration)
INSERT INTO tracks (album_id, track_number, title, duration)
SELECT m.keep_id, t.track_number, t.title, t.duration
FROM tracks t
JOIN tmp_album_dup_map m ON t.album_id = m.dup_id
LEFT JOIN tracks tk
  ON tk.album_id = m.keep_id
 AND tk.track_number = t.track_number
 AND tk.title = t.title
 AND ((tk.duration IS NULL AND t.duration IS NULL) OR tk.duration = t.duration)
WHERE tk.id IS NULL;

-- Remove duplicate albums (tracks cascade delete)
DELETE al
FROM albums al
JOIN tmp_album_dup_map m ON al.id = m.dup_id;

-- Report
SELECT COUNT(*) AS duplicate_albums_removed FROM tmp_album_dup_map;
SELECT COUNT(*) AS remaining_duplicate_groups
FROM (
  SELECT artist_id, LOWER(TRIM(title)) AS norm_title
  FROM albums
  GROUP BY artist_id, LOWER(TRIM(title))
  HAVING COUNT(*) > 1
) x;

COMMIT;
