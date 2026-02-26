USE music_review;

-- 仅保留并补齐以下乐队的猜乐队字段，不修改 description / photo_url
UPDATE artists
SET
    country = CASE name
        WHEN 'Dream Theater' THEN 'US'
        WHEN 'The Beatles' THEN 'UK'
        WHEN 'The Rolling Stones' THEN 'UK'
        WHEN 'Pink Floyd' THEN 'UK'
        WHEN 'Queen' THEN 'UK'
        WHEN 'Led Zeppelin' THEN 'UK'
        WHEN 'Nirvana' THEN 'US'
        WHEN 'Radiohead' THEN 'UK'
        WHEN 'Oasis' THEN 'UK'
        WHEN 'U2' THEN 'Ireland'
        WHEN 'Metallica' THEN 'US'
        WHEN 'Iron Maiden' THEN 'UK'
        WHEN 'Black Sabbath' THEN 'UK'
        WHEN 'AC/DC' THEN 'Australia'
        WHEN 'Guns N'' Roses' THEN 'US'
        WHEN 'Green Day' THEN 'US'
        WHEN 'Blink-182' THEN 'US'
        WHEN 'Red Hot Chili Peppers' THEN 'US'
        WHEN 'My Chemical Romance' THEN 'US'
        WHEN 'Bon Jovi' THEN 'US'
        WHEN 'Eagles' THEN 'US'
        WHEN 'The Police' THEN 'UK'
        WHEN 'Scorpions' THEN 'Germany'
        WHEN 'Deep Purple' THEN 'UK'
        WHEN 'Journey' THEN 'US'
        WHEN 'X Japan' THEN 'Japan'
        ELSE country
    END,
    formed_year = CASE name
        WHEN 'Dream Theater' THEN 1985
        WHEN 'The Beatles' THEN 1960
        WHEN 'The Rolling Stones' THEN 1962
        WHEN 'Pink Floyd' THEN 1965
        WHEN 'Queen' THEN 1970
        WHEN 'Led Zeppelin' THEN 1968
        WHEN 'Nirvana' THEN 1987
        WHEN 'Radiohead' THEN 1985
        WHEN 'Oasis' THEN 1991
        WHEN 'U2' THEN 1976
        WHEN 'Metallica' THEN 1981
        WHEN 'Iron Maiden' THEN 1975
        WHEN 'Black Sabbath' THEN 1968
        WHEN 'AC/DC' THEN 1973
        WHEN 'Guns N'' Roses' THEN 1985
        WHEN 'Green Day' THEN 1987
        WHEN 'Blink-182' THEN 1992
        WHEN 'Red Hot Chili Peppers' THEN 1982
        WHEN 'My Chemical Romance' THEN 2001
        WHEN 'Bon Jovi' THEN 1983
        WHEN 'Eagles' THEN 1971
        WHEN 'The Police' THEN 1977
        WHEN 'Scorpions' THEN 1965
        WHEN 'Deep Purple' THEN 1968
        WHEN 'Journey' THEN 1973
        WHEN 'X Japan' THEN 1982
        ELSE formed_year
    END,
    genre = CASE name
        WHEN 'Dream Theater' THEN 'Progressive Metal'
        WHEN 'The Beatles' THEN 'Rock'
        WHEN 'The Rolling Stones' THEN 'Rock'
        WHEN 'Pink Floyd' THEN 'Progressive Rock'
        WHEN 'Queen' THEN 'Rock'
        WHEN 'Led Zeppelin' THEN 'Hard Rock'
        WHEN 'Nirvana' THEN 'Grunge'
        WHEN 'Radiohead' THEN 'Alternative Rock'
        WHEN 'Oasis' THEN 'Britpop'
        WHEN 'U2' THEN 'Rock'
        WHEN 'Metallica' THEN 'Metal'
        WHEN 'Iron Maiden' THEN 'Metal'
        WHEN 'Black Sabbath' THEN 'Metal'
        WHEN 'AC/DC' THEN 'Hard Rock'
        WHEN 'Guns N'' Roses' THEN 'Hard Rock'
        WHEN 'Green Day' THEN 'Punk Rock'
        WHEN 'Blink-182' THEN 'Pop Punk'
        WHEN 'Red Hot Chili Peppers' THEN 'Funk Rock'
        WHEN 'My Chemical Romance' THEN 'Alternative Rock'
        WHEN 'Bon Jovi' THEN 'Hard Rock'
        WHEN 'Eagles' THEN 'Rock'
        WHEN 'The Police' THEN 'Rock'
        WHEN 'Scorpions' THEN 'Hard Rock'
        WHEN 'Deep Purple' THEN 'Hard Rock'
        WHEN 'Journey' THEN 'Rock'
        WHEN 'X Japan' THEN 'Metal'
        ELSE genre
    END,
    member_count = CASE name
        WHEN 'Dream Theater' THEN 5
        WHEN 'The Beatles' THEN 4
        WHEN 'The Rolling Stones' THEN 4
        WHEN 'Pink Floyd' THEN 4
        WHEN 'Queen' THEN 4
        WHEN 'Led Zeppelin' THEN 4
        WHEN 'Nirvana' THEN 3
        WHEN 'Radiohead' THEN 5
        WHEN 'Oasis' THEN 5
        WHEN 'U2' THEN 4
        WHEN 'Metallica' THEN 4
        WHEN 'Iron Maiden' THEN 6
        WHEN 'Black Sabbath' THEN 4
        WHEN 'AC/DC' THEN 5
        WHEN 'Guns N'' Roses' THEN 6
        WHEN 'Green Day' THEN 3
        WHEN 'Blink-182' THEN 3
        WHEN 'Red Hot Chili Peppers' THEN 4
        WHEN 'My Chemical Romance' THEN 4
        WHEN 'Bon Jovi' THEN 5
        WHEN 'Eagles' THEN 5
        WHEN 'The Police' THEN 3
        WHEN 'Scorpions' THEN 5
        WHEN 'Deep Purple' THEN 5
        WHEN 'Journey' THEN 5
        WHEN 'X Japan' THEN 5
        ELSE member_count
    END,
    status = CASE name
        WHEN 'Dream Theater' THEN '活跃'
        WHEN 'The Beatles' THEN '解散'
        WHEN 'The Rolling Stones' THEN '活跃'
        WHEN 'Pink Floyd' THEN '解散'
        WHEN 'Queen' THEN '活跃'
        WHEN 'Led Zeppelin' THEN '解散'
        WHEN 'Nirvana' THEN '解散'
        WHEN 'Radiohead' THEN '活跃'
        WHEN 'Oasis' THEN '解散'
        WHEN 'U2' THEN '活跃'
        WHEN 'Metallica' THEN '活跃'
        WHEN 'Iron Maiden' THEN '活跃'
        WHEN 'Black Sabbath' THEN '解散'
        WHEN 'AC/DC' THEN '活跃'
        WHEN 'Guns N'' Roses' THEN '活跃'
        WHEN 'Green Day' THEN '活跃'
        WHEN 'Blink-182' THEN '活跃'
        WHEN 'Red Hot Chili Peppers' THEN '活跃'
        WHEN 'My Chemical Romance' THEN '活跃'
        WHEN 'Bon Jovi' THEN '活跃'
        WHEN 'Eagles' THEN '活跃'
        WHEN 'The Police' THEN '解散'
        WHEN 'Scorpions' THEN '活跃'
        WHEN 'Deep Purple' THEN '活跃'
        WHEN 'Journey' THEN '活跃'
        WHEN 'X Japan' THEN '活跃'
        ELSE status
    END
WHERE name IN (
    'Dream Theater',
    'The Beatles', 'The Rolling Stones', 'Pink Floyd', 'Queen', 'Led Zeppelin',
    'Nirvana', 'Radiohead', 'Oasis', 'U2',
    'Metallica', 'Iron Maiden', 'Black Sabbath', 'AC/DC', 'Guns N'' Roses',
    'Green Day', 'Blink-182', 'Red Hot Chili Peppers',
    'My Chemical Romance', 'Bon Jovi', 'Eagles', 'The Police', 'Scorpions',
    'Deep Purple', 'Journey', 'X Japan'
);

-- 可选：查看这 26 支乐队是否补齐
SELECT name, country, formed_year, genre, member_count, status
FROM artists
WHERE name IN (
    'Dream Theater',
    'The Beatles', 'The Rolling Stones', 'Pink Floyd', 'Queen', 'Led Zeppelin',
    'Nirvana', 'Radiohead', 'Oasis', 'U2',
    'Metallica', 'Iron Maiden', 'Black Sabbath', 'AC/DC', 'Guns N'' Roses',
    'Green Day', 'Blink-182', 'Red Hot Chili Peppers',
    'My Chemical Romance', 'Bon Jovi', 'Eagles', 'The Police', 'Scorpions',
    'Deep Purple', 'Journey', 'X Japan'
)
ORDER BY name;
