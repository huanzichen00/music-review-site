-- Add fields for band-guess game alignment
ALTER TABLE artists
    ADD COLUMN genre VARCHAR(80) NULL COMMENT '乐队风格',
    ADD COLUMN member_count INT NULL COMMENT '成员人数',
    ADD COLUMN status VARCHAR(20) NULL COMMENT '状态: 活跃/解散';
