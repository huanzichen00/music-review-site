USE music_review;

-- 1) 确保列存在（兼容 MySQL 5.7/8）
SET @db_name := DATABASE();

SET @has_genre := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'artists'
    AND COLUMN_NAME = 'genre'
);
SET @sql := IF(
  @has_genre = 0,
  "ALTER TABLE artists ADD COLUMN genre VARCHAR(80) NULL COMMENT '乐队风格'",
  "SELECT 'genre exists' AS msg"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_member_count := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'artists'
    AND COLUMN_NAME = 'member_count'
);
SET @sql := IF(
  @has_member_count = 0,
  "ALTER TABLE artists ADD COLUMN member_count INT NULL COMMENT '成员人数'",
  "SELECT 'member_count exists' AS msg"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_status := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = @db_name
    AND TABLE_NAME = 'artists'
    AND COLUMN_NAME = 'status'
);
SET @sql := IF(
  @has_status = 0,
  "ALTER TABLE artists ADD COLUMN status VARCHAR(20) NULL COMMENT '状态: 活跃/解散'",
  "SELECT 'status exists' AS msg"
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2) 临时数据表
DROP TEMPORARY TABLE IF EXISTS tmp_artist_seed;
CREATE TEMPORARY TABLE tmp_artist_seed (
  name VARCHAR(100) PRIMARY KEY,
  country VARCHAR(50),
  formed_year INT,
  genre VARCHAR(80),
  member_count INT,
  status VARCHAR(20)
) ENGINE=MEMORY DEFAULT CHARSET=utf8mb4;

INSERT INTO tmp_artist_seed (name, country, formed_year, genre, member_count, status) VALUES
('Dream Theater','US',1985,'Progressive Metal',5,'活跃'),
('The Beatles','UK',1960,'Rock',4,'解散'),
('The Rolling Stones','UK',1962,'Rock',4,'活跃'),
('Pink Floyd','UK',1965,'Progressive Rock',4,'解散'),
('Queen','UK',1970,'Rock',4,'活跃'),
('Led Zeppelin','UK',1968,'Hard Rock',4,'解散'),
('Nirvana','US',1987,'Grunge',3,'解散'),
('Radiohead','UK',1985,'Alternative Rock',5,'活跃'),
('Oasis','UK',1991,'Britpop',5,'解散'),
('U2','Ireland',1976,'Rock',4,'活跃'),
('Metallica','US',1981,'Metal',4,'活跃'),
('Iron Maiden','UK',1975,'Metal',6,'活跃'),
('Black Sabbath','UK',1968,'Metal',4,'解散'),
('AC/DC','Australia',1973,'Hard Rock',5,'活跃'),
('Guns N'' Roses','US',1985,'Hard Rock',6,'活跃'),
('Green Day','US',1987,'Punk Rock',3,'活跃'),
('Blink-182','US',1992,'Pop Punk',3,'活跃'),
('Red Hot Chili Peppers','US',1982,'Funk Rock',4,'活跃'),
('My Chemical Romance','US',2001,'Alternative Rock',4,'活跃'),
('Bon Jovi','US',1983,'Hard Rock',5,'活跃'),
('Eagles','US',1971,'Rock',5,'活跃'),
('The Police','UK',1977,'Rock',3,'解散'),
('Scorpions','Germany',1965,'Hard Rock',5,'活跃'),
('Deep Purple','UK',1968,'Hard Rock',5,'活跃'),
('Journey','US',1973,'Rock',5,'活跃'),
('X Japan','Japan',1982,'Metal',5,'活跃'),

('Megadeth','US',1983,'Thrash Metal',5,'活跃'),
('Slayer','US',1981,'Thrash Metal',4,'解散'),
('Anthrax','US',1981,'Thrash Metal',5,'活跃'),
('Exodus','US',1979,'Thrash Metal',5,'活跃'),
('Testament','US',1983,'Thrash Metal',5,'活跃'),
('Death','US',1983,'Death Metal',4,'解散'),
('Morbid Angel','US',1983,'Death Metal',4,'活跃'),
('Cannibal Corpse','US',1988,'Death Metal',5,'活跃'),
('Obituary','US',1984,'Death Metal',5,'活跃'),
('Deicide','US',1987,'Death Metal',4,'活跃'),
('Mayhem','Norway',1984,'Black Metal',4,'活跃'),
('Darkthrone','Norway',1986,'Black Metal',2,'活跃'),
('Emperor','Norway',1991,'Black Metal',4,'解散'),
('Immortal','Norway',1991,'Black Metal',3,'活跃'),
('Burzum','Norway',1991,'Black Metal',1,'活跃'),
('Helloween','Germany',1984,'Power Metal',7,'活跃'),
('Blind Guardian','Germany',1984,'Power Metal',4,'活跃'),
('Gamma Ray','Germany',1989,'Power Metal',4,'活跃'),
('Stratovarius','Finland',1984,'Power Metal',5,'活跃'),
('Sabaton','Sweden',1999,'Power Metal',6,'活跃'),
('Kreator','Germany',1982,'Thrash Metal',4,'活跃'),
('Sodom','Germany',1981,'Thrash Metal',3,'活跃'),
('Destruction','Germany',1982,'Thrash Metal',3,'活跃'),
('Sepultura','Brazil',1984,'Thrash Metal',4,'活跃'),
('Overkill','US',1980,'Thrash Metal',5,'活跃'),
('Behemoth','Poland',1991,'Blackened Death Metal',3,'活跃'),

('The Strokes','US',1998,'Indie Rock',5,'活跃'),
('Muse','UK',1994,'Alternative Rock',3,'活跃'),
('Blur','UK',1988,'Britpop',4,'活跃'),
('The Smashing Pumpkins','US',1988,'Alternative Rock',4,'活跃'),
('R.E.M.','US',1980,'Alternative Rock',4,'解散'),
('The Cure','UK',1978,'Post Punk',5,'活跃'),
('Joy Division','UK',1976,'Post Punk',4,'解散'),
('The Clash','UK',1976,'Punk Rock',4,'解散'),
('Aerosmith','US',1970,'Hard Rock',5,'活跃'),
('Fleetwood Mac','UK',1967,'Rock',5,'活跃'),
('Genesis','UK',1967,'Progressive Rock',3,'活跃'),
('Rush','Canada',1968,'Progressive Rock',3,'解散'),
('Yes','UK',1968,'Progressive Rock',5,'活跃'),
('Talking Heads','US',1975,'New Wave',4,'解散'),
('The Velvet Underground','US',1964,'Art Rock',4,'解散'),
('Tool','US',1990,'Progressive Metal',4,'活跃'),
('Porcupine Tree','UK',1987,'Progressive Rock',4,'活跃'),
('Meshuggah','Sweden',1987,'Progressive Metal',5,'活跃'),
('Mastodon','US',2000,'Progressive Metal',4,'活跃'),
('Carcass','UK',1985,'Death Metal',4,'活跃'),
('Napalm Death','UK',1981,'Grindcore',5,'活跃'),
('At the Gates','Sweden',1990,'Melodic Death Metal',5,'活跃'),
('Symphony X','US',1994,'Progressive Metal',5,'活跃'),
('Fates Warning','US',1982,'Progressive Metal',5,'活跃'),

('Opeth','Sweden',1990,'Progressive Metal',5,'活跃'),
('唐朝','华语',1988,'Heavy Metal',4,'活跃'),
('黑豹','华语',1987,'Rock',5,'活跃'),
('Beyond','华语',1983,'Rock',4,'解散'),
('痛仰','华语',1999,'Alternative Rock',4,'活跃'),
('万能青年旅店','华语',2002,'Alternative Rock',5,'活跃'),
('万青','华语',2002,'Alternative Rock',5,'活跃'),
('新裤子','华语',1996,'New Wave',4,'活跃'),
('超载','华语',1991,'Metal',4,'活跃'),
('Dire Straits','UK',1977,'Rock',4,'解散'),
('Cream','UK',1966,'Blues Rock',3,'解散'),
('Jethro Tull','UK',1967,'Progressive Rock',5,'活跃'),
('Lynyrd Skynyrd','US',1964,'Southern Rock',5,'活跃'),
('Creedence Clearwater Revival','US',1967,'Rock',4,'解散'),
('Camel','UK',1971,'Progressive Rock',4,'活跃'),
('Gentle Giant','UK',1970,'Progressive Rock',6,'解散'),
('Emerson, Lake & Palmer','UK',1970,'Progressive Rock',3,'解散'),
('Riverside','Poland',2001,'Progressive Rock',4,'活跃'),
('Skid Row','US',1986,'Hard Rock',5,'活跃'),
('Twisted Sister','US',1972,'Heavy Metal',5,'解散'),
('Europe','Sweden',1979,'Hard Rock',5,'活跃'),
('Whitesnake','UK',1978,'Hard Rock',5,'活跃'),
('Def Leppard','UK',1977,'Hard Rock',5,'活跃'),
('Mr. Big','US',1988,'Hard Rock',4,'活跃'),
('Rhapsody','Italy',1993,'Power Metal',5,'活跃'),
('Judas Priest','UK',1969,'Metal',5,'活跃'),
('Manowar','US',1980,'Heavy Metal',4,'活跃'),
('Angra','Brazil',1991,'Power Metal',5,'活跃'),
('Sonic Youth','US',1981,'Alternative Rock',4,'解散'),
('Pixies','US',1986,'Alternative Rock',4,'活跃'),
('My Bloody Valentine','Ireland',1983,'Shoegaze',3,'活跃'),
('New Order','UK',1980,'New Wave',4,'活跃');

-- 3) 先更新已存在 artist
UPDATE artists a
JOIN tmp_artist_seed t ON t.name = a.name
SET
  a.country = t.country,
  a.formed_year = t.formed_year,
  a.genre = t.genre,
  a.member_count = t.member_count,
  a.status = t.status;

-- 4) 再插入数据库里不存在的 artist
INSERT INTO artists (name, name_initial, country, formed_year, genre, member_count, status)
SELECT
  t.name,
  CASE
    WHEN t.name REGEXP '^[A-Za-z]' THEN UPPER(LEFT(t.name, 1))
    ELSE '#'
  END AS name_initial,
  t.country, t.formed_year, t.genre, t.member_count, t.status
FROM tmp_artist_seed t
LEFT JOIN artists a ON a.name = t.name
WHERE a.id IS NULL;

-- 5) 校验
SELECT name, country, formed_year, genre, member_count, status
FROM artists
WHERE name IN (SELECT name FROM tmp_artist_seed)
ORDER BY name;
