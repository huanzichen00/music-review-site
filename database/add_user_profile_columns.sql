-- 添加用户头像和简介字段
-- 如果字段已存在会报错，可以忽略

USE music_review;

-- 添加头像 URL 字段
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(255) COMMENT '头像URL';

-- 添加个人简介字段
ALTER TABLE users ADD COLUMN bio TEXT COMMENT '个人简介';
