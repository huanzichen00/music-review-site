-- =====================================================
-- 乐评网站数据库初始化脚本
-- 项目: music-review-site
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS music_review 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE music_review;

-- =====================================================
-- 1. 用户表
-- =====================================================
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
    password VARCHAR(255) NOT NULL COMMENT '密码(加密)',
    avatar VARCHAR(255) COMMENT '头像URL',
    role VARCHAR(20) DEFAULT 'USER' COMMENT '角色: USER/ADMIN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) COMMENT '用户表';

-- =====================================================
-- 2. 艺术家表
-- =====================================================
CREATE TABLE artists (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '艺术家/乐队名',
    name_initial CHAR(1) NOT NULL COMMENT '名称首字母(A-Z, #)',
    country VARCHAR(50) COMMENT '国家/地区',
    formed_year INT COMMENT '成立年份',
    description TEXT COMMENT '简介',
    photo_url VARCHAR(255) COMMENT '图片URL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间'
) COMMENT '艺术家表';

CREATE INDEX idx_artists_initial ON artists(name_initial);

-- =====================================================
-- 3. 流派表
-- =====================================================
CREATE TABLE genres (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '流派名称',
    description TEXT COMMENT '流派描述'
) COMMENT '流派表';

-- =====================================================
-- 4. 专辑表
-- =====================================================
CREATE TABLE albums (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '专辑名称',
    title_initial CHAR(1) NOT NULL COMMENT '标题首字母(A-Z, #)',
    artist_id BIGINT NOT NULL COMMENT '艺术家ID',
    release_year INT COMMENT '发行年份',
    cover_url VARCHAR(255) COMMENT '封面图片URL',
    description TEXT COMMENT '专辑简介',
    created_by BIGINT COMMENT '上传者ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) COMMENT '专辑表';

CREATE INDEX idx_albums_initial ON albums(title_initial);
CREATE INDEX idx_albums_artist ON albums(artist_id);

-- =====================================================
-- 5. 专辑-流派关联表 (多对多)
-- =====================================================
CREATE TABLE album_genres (
    album_id BIGINT NOT NULL COMMENT '专辑ID',
    genre_id BIGINT NOT NULL COMMENT '流派ID',
    
    PRIMARY KEY (album_id, genre_id),
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
) COMMENT '专辑-流派关联表';

-- =====================================================
-- 6. 曲目表
-- =====================================================
CREATE TABLE tracks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    album_id BIGINT NOT NULL COMMENT '专辑ID',
    track_number INT NOT NULL COMMENT '曲目序号',
    title VARCHAR(200) NOT NULL COMMENT '歌曲名称',
    duration INT COMMENT '时长(秒)',
    
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
) COMMENT '曲目表';

CREATE INDEX idx_tracks_album ON tracks(album_id);

-- =====================================================
-- 7. 收藏表
-- =====================================================
CREATE TABLE favorites (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    album_id BIGINT NOT NULL COMMENT '专辑ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    
    UNIQUE KEY uk_user_album (user_id, album_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
) COMMENT '收藏表';

-- =====================================================
-- 8. 评论表
-- =====================================================
CREATE TABLE reviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    album_id BIGINT NOT NULL COMMENT '专辑ID',
    rating DECIMAL(2,1) COMMENT '评分(0-5)',
    content TEXT COMMENT '评论内容',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '评论时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_user_album_review (user_id, album_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE
) COMMENT '评论表';

-- =====================================================
-- 初始数据: 流派
-- =====================================================
INSERT INTO genres (name, description) VALUES
('Progressive Rock', '前卫摇滚'),
('Art Rock', '艺术摇滚'),
('Symphonic Prog', '交响前卫'),
('Canterbury Scene', '坎特伯雷'),
('Krautrock', '德国摇滚'),
('Jazz Rock/Fusion', '爵士摇滚/融合'),
('Post Rock', '后摇滚'),
('Psychedelic Rock', '迷幻摇滚'),
('Heavy Prog', '重型前卫'),
('Neo-Prog', '新前卫'),
('Zeuhl', '泽尔'),
('RPI', '意大利前卫'),
('Eclectic Prog', '折衷前卫'),
('Proto-Prog', '原型前卫'),
('Crossover Prog', '跨界前卫');

-- =====================================================
-- 完成提示
-- =====================================================
SELECT '数据库初始化完成!' AS message;
