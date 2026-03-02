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
    avatar_url VARCHAR(255) COMMENT '头像URL',
    bio TEXT COMMENT '个人简介',
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
    genre VARCHAR(80) COMMENT '乐队风格',
    member_count INT COMMENT '成员人数',
    status VARCHAR(20) COMMENT '状态: 活跃/解散',
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
-- 9. 评论回复表
-- =====================================================
CREATE TABLE review_replies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    review_id BIGINT NOT NULL COMMENT '评论ID',
    user_id BIGINT NOT NULL COMMENT '回复用户ID',
    content TEXT NOT NULL COMMENT '回复内容',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '回复时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT '评论回复表';

CREATE INDEX idx_replies_review ON review_replies(review_id);

-- =====================================================
-- 10. 博客文章表
-- =====================================================
CREATE TABLE blog_posts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '作者用户ID',
    album_id BIGINT COMMENT '关联专辑ID',
    title VARCHAR(200) NOT NULL COMMENT '文章标题',
    content TEXT NOT NULL COMMENT '文章内容',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL
) COMMENT '博客文章表';

CREATE INDEX idx_blog_posts_user ON blog_posts(user_id);
CREATE INDEX idx_blog_posts_album ON blog_posts(album_id);

-- =====================================================
-- 11. 博客回复表
-- =====================================================
CREATE TABLE blog_replies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    blog_post_id BIGINT NOT NULL COMMENT '博客文章ID',
    user_id BIGINT NOT NULL COMMENT '回复用户ID',
    content TEXT NOT NULL COMMENT '回复内容',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '回复时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (blog_post_id) REFERENCES blog_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT '博客回复表';

CREATE INDEX idx_blog_replies_post ON blog_replies(blog_post_id);

-- =====================================================
-- 12. 消息通知表
-- =====================================================
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL COMMENT '接收通知用户ID',
    sender_user_id BIGINT COMMENT '发送者用户ID',
    type VARCHAR(30) NOT NULL COMMENT '通知类型: BLOG_REPLY/ANNOUNCEMENT',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '通知内容',
    related_blog_post_id BIGINT COMMENT '关联博客文章ID',
    related_blog_reply_id BIGINT COMMENT '关联博客回复ID',
    is_read BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否已读',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT '消息通知表';

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);

-- =====================================================
-- 13. 猜乐队自选题库
-- =====================================================
CREATE TABLE question_banks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '题库名称',
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC' COMMENT '可见性: PUBLIC/PRIVATE',
    share_token VARCHAR(64) NOT NULL UNIQUE COMMENT '分享令牌',
    owner_user_id BIGINT NOT NULL COMMENT '题库创建者',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT '猜乐队题库表';

CREATE INDEX idx_question_banks_owner ON question_banks(owner_user_id);
CREATE INDEX idx_question_banks_visibility ON question_banks(visibility);

CREATE TABLE question_bank_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_bank_id BIGINT NOT NULL COMMENT '题库ID',
    artist_id BIGINT NOT NULL COMMENT '乐队ID',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入题库时间',

    UNIQUE KEY uk_question_bank_artist (question_bank_id, artist_id),
    FOREIGN KEY (question_bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
    FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
) COMMENT '猜乐队题库-乐队关联表';

CREATE INDEX idx_question_bank_items_bank ON question_bank_items(question_bank_id);
CREATE INDEX idx_question_bank_items_artist ON question_bank_items(artist_id);

-- =====================================================
-- 14. 猜乐队联机房间与比赛记录
-- =====================================================
CREATE TABLE guess_band_online_rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(16) NOT NULL UNIQUE COMMENT '房间号',
    invite_token VARCHAR(64) NOT NULL UNIQUE COMMENT '邀请令牌',
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING' COMMENT '状态: WAITING/IN_PROGRESS/FINISHED',
    question_bank_id BIGINT COMMENT '题库ID，可为空(默认题库)',
    target_artist_id BIGINT COMMENT '本局目标乐队',
    owner_user_id BIGINT COMMENT '房主用户ID，可为空(游客)',
    owner_player_token VARCHAR(64) NOT NULL COMMENT '房主玩家令牌',
    max_attempts INT NOT NULL DEFAULT 10 COMMENT '每名玩家最大尝试次数',
    started_at DATETIME COMMENT '开始时间',
    finished_at DATETIME COMMENT '结束时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    FOREIGN KEY (question_bank_id) REFERENCES question_banks(id) ON DELETE SET NULL,
    FOREIGN KEY (target_artist_id) REFERENCES artists(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT '猜乐队联机房间表';

CREATE INDEX idx_guess_band_online_rooms_status ON guess_band_online_rooms(status);
CREATE INDEX idx_guess_band_online_rooms_created_at ON guess_band_online_rooms(created_at);

CREATE TABLE guess_band_online_players (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL COMMENT '房间ID',
    player_token VARCHAR(64) NOT NULL COMMENT '玩家令牌',
    user_id BIGINT COMMENT '关联用户ID，可为空(游客)',
    display_name VARCHAR(80) NOT NULL COMMENT '显示名',
    seat_index INT NOT NULL COMMENT '席位顺序',
    is_ready BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否准备',
    last_seen_at DATETIME COMMENT '最后活跃时间',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    UNIQUE KEY uk_guess_band_room_player_token (room_id, player_token),
    FOREIGN KEY (room_id) REFERENCES guess_band_online_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) COMMENT '猜乐队联机房间玩家表';

CREATE INDEX idx_guess_band_online_players_room ON guess_band_online_players(room_id);
CREATE INDEX idx_guess_band_online_players_user ON guess_band_online_players(user_id);

CREATE TABLE guess_band_online_guesses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL COMMENT '房间ID',
    player_id BIGINT NOT NULL COMMENT '玩家ID',
    guessed_artist_id BIGINT NOT NULL COMMENT '猜测乐队ID',
    is_correct BOOLEAN NOT NULL COMMENT '是否猜中',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (room_id) REFERENCES guess_band_online_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES guess_band_online_players(id) ON DELETE CASCADE,
    FOREIGN KEY (guessed_artist_id) REFERENCES artists(id) ON DELETE CASCADE
) COMMENT '猜乐队联机猜测记录表';

CREATE INDEX idx_guess_band_online_guesses_room ON guess_band_online_guesses(room_id);
CREATE INDEX idx_guess_band_online_guesses_player ON guess_band_online_guesses(player_id);
CREATE INDEX idx_guess_band_online_guesses_created_at ON guess_band_online_guesses(created_at);

CREATE TABLE guess_band_online_match_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(16) NOT NULL COMMENT '房间号',
    question_bank_id BIGINT COMMENT '题库ID',
    host_display_name VARCHAR(80) NOT NULL COMMENT '房主显示名',
    guest_display_name VARCHAR(80) NOT NULL COMMENT '客方显示名',
    winner_display_name VARCHAR(80) COMMENT '获胜方显示名，空表示平局',
    total_guesses INT NOT NULL DEFAULT 0 COMMENT '总猜测次数',
    started_at DATETIME COMMENT '开始时间',
    finished_at DATETIME COMMENT '结束时间',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',

    FOREIGN KEY (question_bank_id) REFERENCES question_banks(id) ON DELETE SET NULL
) COMMENT '猜乐队联机比赛记录表';

CREATE INDEX idx_guess_band_online_records_created_at ON guess_band_online_match_records(created_at);

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
