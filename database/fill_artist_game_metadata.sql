USE music_review;

-- 批量补齐猜乐队需要的字段，不修改 description / photo_url
UPDATE artists
SET
    country = CASE name
        WHEN 'Dream Theater' THEN 'US'
        WHEN '梦剧院' THEN 'US'
        WHEN 'The Beatles' THEN 'UK'
        WHEN 'The Rolling Stones' THEN 'UK'
        WHEN 'Pink Floyd' THEN 'UK'
        WHEN 'Queen' THEN 'UK'
        WHEN 'Led Zeppelin' THEN 'UK'
        WHEN 'Nirvana' THEN 'US'
        WHEN 'Radiohead' THEN 'UK'
        WHEN 'Arctic Monkeys' THEN 'UK'
        WHEN 'Coldplay' THEN 'UK'
        WHEN 'Muse' THEN 'UK'
        WHEN 'Oasis' THEN 'UK'
        WHEN 'U2' THEN 'Ireland'
        WHEN 'The Cure' THEN 'UK'
        WHEN 'Metallica' THEN 'US'
        WHEN 'Iron Maiden' THEN 'UK'
        WHEN 'Black Sabbath' THEN 'UK'
        WHEN 'AC/DC' THEN 'Australia'
        WHEN 'Guns N'' Roses' THEN 'US'
        WHEN 'Linkin Park' THEN 'US'
        WHEN 'Green Day' THEN 'US'
        WHEN 'Blink-182' THEN 'US'
        WHEN 'Red Hot Chili Peppers' THEN 'US'
        WHEN 'Foo Fighters' THEN 'US'
        WHEN 'Paramore' THEN 'US'
        WHEN 'Imagine Dragons' THEN 'US'
        WHEN 'OneRepublic' THEN 'US'
        WHEN 'Maroon 5' THEN 'US'
        WHEN 'The 1975' THEN 'UK'
        WHEN 'Maneskin' THEN 'Italy'
        WHEN 'My Chemical Romance' THEN 'US'
        WHEN 'Bon Jovi' THEN 'US'
        WHEN 'Eagles' THEN 'US'
        WHEN 'The Police' THEN 'UK'
        WHEN 'Scorpions' THEN 'Germany'
        WHEN 'Deep Purple' THEN 'UK'
        WHEN 'Journey' THEN 'US'
        WHEN 'Rammstein' THEN 'Germany'
        WHEN 'X Japan' THEN 'Japan'
        WHEN 'ONE OK ROCK' THEN 'Japan'
        WHEN 'BUMP OF CHICKEN' THEN 'Japan'
        WHEN '五月天' THEN '华语'
        WHEN '苏打绿' THEN '华语'
        WHEN '草东没有派对' THEN '华语'
        WHEN '新裤子' THEN '华语'
        WHEN '万能青年旅店' THEN '华语'
        WHEN '二手玫瑰' THEN '华语'
        WHEN '逃跑计划' THEN '华语'
        WHEN '刺猬' THEN '华语'
        WHEN '痛仰乐队' THEN '华语'
        WHEN '告五人' THEN '华语'
        ELSE country
    END,
    formed_year = CASE name
        WHEN 'Dream Theater' THEN 1985
        WHEN '梦剧院' THEN 1985
        WHEN 'The Beatles' THEN 1960
        WHEN 'The Rolling Stones' THEN 1962
        WHEN 'Pink Floyd' THEN 1965
        WHEN 'Queen' THEN 1970
        WHEN 'Led Zeppelin' THEN 1968
        WHEN 'Nirvana' THEN 1987
        WHEN 'Radiohead' THEN 1985
        WHEN 'Arctic Monkeys' THEN 2002
        WHEN 'Coldplay' THEN 1997
        WHEN 'Muse' THEN 1994
        WHEN 'Oasis' THEN 1991
        WHEN 'U2' THEN 1976
        WHEN 'The Cure' THEN 1978
        WHEN 'Metallica' THEN 1981
        WHEN 'Iron Maiden' THEN 1975
        WHEN 'Black Sabbath' THEN 1968
        WHEN 'AC/DC' THEN 1973
        WHEN 'Guns N'' Roses' THEN 1985
        WHEN 'Linkin Park' THEN 1996
        WHEN 'Green Day' THEN 1987
        WHEN 'Blink-182' THEN 1992
        WHEN 'Red Hot Chili Peppers' THEN 1982
        WHEN 'Foo Fighters' THEN 1994
        WHEN 'Paramore' THEN 2004
        WHEN 'Imagine Dragons' THEN 2008
        WHEN 'OneRepublic' THEN 2002
        WHEN 'Maroon 5' THEN 1994
        WHEN 'The 1975' THEN 2002
        WHEN 'Maneskin' THEN 2016
        WHEN 'My Chemical Romance' THEN 2001
        WHEN 'Bon Jovi' THEN 1983
        WHEN 'Eagles' THEN 1971
        WHEN 'The Police' THEN 1977
        WHEN 'Scorpions' THEN 1965
        WHEN 'Deep Purple' THEN 1968
        WHEN 'Journey' THEN 1973
        WHEN 'Rammstein' THEN 1994
        WHEN 'X Japan' THEN 1982
        WHEN 'ONE OK ROCK' THEN 2005
        WHEN 'BUMP OF CHICKEN' THEN 1994
        WHEN '五月天' THEN 1997
        WHEN '苏打绿' THEN 2001
        WHEN '草东没有派对' THEN 2012
        WHEN '新裤子' THEN 1996
        WHEN '万能青年旅店' THEN 2002
        WHEN '二手玫瑰' THEN 1999
        WHEN '逃跑计划' THEN 2004
        WHEN '刺猬' THEN 2005
        WHEN '痛仰乐队' THEN 1999
        WHEN '告五人' THEN 2017
        ELSE formed_year
    END,
    genre = CASE name
        WHEN 'Dream Theater' THEN 'Progressive Metal'
        WHEN '梦剧院' THEN 'Progressive Metal'
        WHEN 'The Beatles' THEN 'Rock'
        WHEN 'The Rolling Stones' THEN 'Rock'
        WHEN 'Pink Floyd' THEN 'Progressive Rock'
        WHEN 'Queen' THEN 'Rock'
        WHEN 'Led Zeppelin' THEN 'Hard Rock'
        WHEN 'Nirvana' THEN 'Grunge'
        WHEN 'Radiohead' THEN 'Alternative Rock'
        WHEN 'Arctic Monkeys' THEN 'Indie Rock'
        WHEN 'Coldplay' THEN 'Pop Rock'
        WHEN 'Muse' THEN 'Alternative Rock'
        WHEN 'Oasis' THEN 'Britpop'
        WHEN 'U2' THEN 'Rock'
        WHEN 'The Cure' THEN 'Post Punk'
        WHEN 'Metallica' THEN 'Metal'
        WHEN 'Iron Maiden' THEN 'Metal'
        WHEN 'Black Sabbath' THEN 'Metal'
        WHEN 'AC/DC' THEN 'Hard Rock'
        WHEN 'Guns N'' Roses' THEN 'Hard Rock'
        WHEN 'Linkin Park' THEN 'Nu Metal'
        WHEN 'Green Day' THEN 'Punk Rock'
        WHEN 'Blink-182' THEN 'Pop Punk'
        WHEN 'Red Hot Chili Peppers' THEN 'Funk Rock'
        WHEN 'Foo Fighters' THEN 'Alternative Rock'
        WHEN 'Paramore' THEN 'Alternative Rock'
        WHEN 'Imagine Dragons' THEN 'Pop Rock'
        WHEN 'OneRepublic' THEN 'Pop Rock'
        WHEN 'Maroon 5' THEN 'Pop Rock'
        WHEN 'The 1975' THEN 'Indie Pop'
        WHEN 'Maneskin' THEN 'Rock'
        WHEN 'My Chemical Romance' THEN 'Alternative Rock'
        WHEN 'Bon Jovi' THEN 'Hard Rock'
        WHEN 'Eagles' THEN 'Rock'
        WHEN 'The Police' THEN 'Rock'
        WHEN 'Scorpions' THEN 'Hard Rock'
        WHEN 'Deep Purple' THEN 'Hard Rock'
        WHEN 'Journey' THEN 'Rock'
        WHEN 'Rammstein' THEN 'Industrial Metal'
        WHEN 'X Japan' THEN 'Metal'
        WHEN 'ONE OK ROCK' THEN 'Alternative Rock'
        WHEN 'BUMP OF CHICKEN' THEN 'Alternative Rock'
        WHEN '五月天' THEN 'Rock'
        WHEN '苏打绿' THEN 'Indie Rock'
        WHEN '草东没有派对' THEN 'Alternative Rock'
        WHEN '新裤子' THEN 'New Wave'
        WHEN '万能青年旅店' THEN 'Alternative Rock'
        WHEN '二手玫瑰' THEN 'Folk Rock'
        WHEN '逃跑计划' THEN 'Pop Rock'
        WHEN '刺猬' THEN 'Alternative Rock'
        WHEN '痛仰乐队' THEN 'Alternative Rock'
        WHEN '告五人' THEN 'Indie Pop'
        ELSE genre
    END,
    member_count = CASE name
        WHEN 'Dream Theater' THEN 5
        WHEN '梦剧院' THEN 5
        WHEN 'The Beatles' THEN 4
        WHEN 'The Rolling Stones' THEN 4
        WHEN 'Pink Floyd' THEN 4
        WHEN 'Queen' THEN 4
        WHEN 'Led Zeppelin' THEN 4
        WHEN 'Nirvana' THEN 3
        WHEN 'Radiohead' THEN 5
        WHEN 'Arctic Monkeys' THEN 4
        WHEN 'Coldplay' THEN 4
        WHEN 'Muse' THEN 3
        WHEN 'Oasis' THEN 5
        WHEN 'U2' THEN 4
        WHEN 'The Cure' THEN 5
        WHEN 'Metallica' THEN 4
        WHEN 'Iron Maiden' THEN 6
        WHEN 'Black Sabbath' THEN 4
        WHEN 'AC/DC' THEN 5
        WHEN 'Guns N'' Roses' THEN 6
        WHEN 'Linkin Park' THEN 6
        WHEN 'Green Day' THEN 3
        WHEN 'Blink-182' THEN 3
        WHEN 'Red Hot Chili Peppers' THEN 4
        WHEN 'Foo Fighters' THEN 6
        WHEN 'Paramore' THEN 3
        WHEN 'Imagine Dragons' THEN 4
        WHEN 'OneRepublic' THEN 5
        WHEN 'Maroon 5' THEN 6
        WHEN 'The 1975' THEN 4
        WHEN 'Maneskin' THEN 4
        WHEN 'My Chemical Romance' THEN 4
        WHEN 'Bon Jovi' THEN 5
        WHEN 'Eagles' THEN 5
        WHEN 'The Police' THEN 3
        WHEN 'Scorpions' THEN 5
        WHEN 'Deep Purple' THEN 5
        WHEN 'Journey' THEN 5
        WHEN 'Rammstein' THEN 6
        WHEN 'X Japan' THEN 5
        WHEN 'ONE OK ROCK' THEN 4
        WHEN 'BUMP OF CHICKEN' THEN 4
        WHEN '五月天' THEN 5
        WHEN '苏打绿' THEN 6
        WHEN '草东没有派对' THEN 4
        WHEN '新裤子' THEN 4
        WHEN '万能青年旅店' THEN 5
        WHEN '二手玫瑰' THEN 5
        WHEN '逃跑计划' THEN 4
        WHEN '刺猬' THEN 3
        WHEN '痛仰乐队' THEN 4
        WHEN '告五人' THEN 3
        ELSE member_count
    END,
    status = CASE name
        WHEN 'Dream Theater' THEN '活跃'
        WHEN '梦剧院' THEN '活跃'
        WHEN 'The Beatles' THEN '解散'
        WHEN 'The Rolling Stones' THEN '活跃'
        WHEN 'Pink Floyd' THEN '解散'
        WHEN 'Queen' THEN '活跃'
        WHEN 'Led Zeppelin' THEN '解散'
        WHEN 'Nirvana' THEN '解散'
        WHEN 'Radiohead' THEN '活跃'
        WHEN 'Arctic Monkeys' THEN '活跃'
        WHEN 'Coldplay' THEN '活跃'
        WHEN 'Muse' THEN '活跃'
        WHEN 'Oasis' THEN '解散'
        WHEN 'U2' THEN '活跃'
        WHEN 'The Cure' THEN '活跃'
        WHEN 'Metallica' THEN '活跃'
        WHEN 'Iron Maiden' THEN '活跃'
        WHEN 'Black Sabbath' THEN '解散'
        WHEN 'AC/DC' THEN '活跃'
        WHEN 'Guns N'' Roses' THEN '活跃'
        WHEN 'Linkin Park' THEN '活跃'
        WHEN 'Green Day' THEN '活跃'
        WHEN 'Blink-182' THEN '活跃'
        WHEN 'Red Hot Chili Peppers' THEN '活跃'
        WHEN 'Foo Fighters' THEN '活跃'
        WHEN 'Paramore' THEN '活跃'
        WHEN 'Imagine Dragons' THEN '活跃'
        WHEN 'OneRepublic' THEN '活跃'
        WHEN 'Maroon 5' THEN '活跃'
        WHEN 'The 1975' THEN '活跃'
        WHEN 'Maneskin' THEN '活跃'
        WHEN 'My Chemical Romance' THEN '活跃'
        WHEN 'Bon Jovi' THEN '活跃'
        WHEN 'Eagles' THEN '活跃'
        WHEN 'The Police' THEN '解散'
        WHEN 'Scorpions' THEN '活跃'
        WHEN 'Deep Purple' THEN '活跃'
        WHEN 'Journey' THEN '活跃'
        WHEN 'Rammstein' THEN '活跃'
        WHEN 'X Japan' THEN '活跃'
        WHEN 'ONE OK ROCK' THEN '活跃'
        WHEN 'BUMP OF CHICKEN' THEN '活跃'
        WHEN '五月天' THEN '活跃'
        WHEN '苏打绿' THEN '活跃'
        WHEN '草东没有派对' THEN '活跃'
        WHEN '新裤子' THEN '活跃'
        WHEN '万能青年旅店' THEN '活跃'
        WHEN '二手玫瑰' THEN '活跃'
        WHEN '逃跑计划' THEN '活跃'
        WHEN '刺猬' THEN '活跃'
        WHEN '痛仰乐队' THEN '活跃'
        WHEN '告五人' THEN '活跃'
        ELSE status
    END
WHERE name IN (
    'Dream Theater', '梦剧院',
    'The Beatles', 'The Rolling Stones', 'Pink Floyd', 'Queen', 'Led Zeppelin',
    'Nirvana', 'Radiohead', 'Arctic Monkeys', 'Coldplay', 'Muse', 'Oasis', 'U2',
    'The Cure', 'Metallica', 'Iron Maiden', 'Black Sabbath', 'AC/DC', 'Guns N'' Roses',
    'Linkin Park', 'Green Day', 'Blink-182', 'Red Hot Chili Peppers', 'Foo Fighters',
    'Paramore', 'Imagine Dragons', 'OneRepublic', 'Maroon 5', 'The 1975', 'Maneskin',
    'My Chemical Romance', 'Bon Jovi', 'Eagles', 'The Police', 'Scorpions', 'Deep Purple',
    'Journey', 'Rammstein', 'X Japan', 'ONE OK ROCK', 'BUMP OF CHICKEN', '五月天', '苏打绿',
    '草东没有派对', '新裤子', '万能青年旅店', '二手玫瑰', '逃跑计划', '刺猬', '痛仰乐队', '告五人'
);

-- 检查补齐结果（可选）
SELECT name, country, formed_year, genre, member_count, status
FROM artists
WHERE name IN (
    'Dream Theater', '梦剧院',
    'The Beatles', 'The Rolling Stones', 'Pink Floyd', 'Queen', 'Led Zeppelin',
    'Nirvana', 'Radiohead', 'Arctic Monkeys', 'Coldplay', 'Muse', 'Oasis', 'U2',
    'The Cure', 'Metallica', 'Iron Maiden', 'Black Sabbath', 'AC/DC', 'Guns N'' Roses',
    'Linkin Park', 'Green Day', 'Blink-182', 'Red Hot Chili Peppers', 'Foo Fighters',
    'Paramore', 'Imagine Dragons', 'OneRepublic', 'Maroon 5', 'The 1975', 'Maneskin',
    'My Chemical Romance', 'Bon Jovi', 'Eagles', 'The Police', 'Scorpions', 'Deep Purple',
    'Journey', 'Rammstein', 'X Japan', 'ONE OK ROCK', 'BUMP OF CHICKEN', '五月天', '苏打绿',
    '草东没有派对', '新裤子', '万能青年旅店', '二手玫瑰', '逃跑计划', '刺猬', '痛仰乐队', '告五人'
)
ORDER BY name;
