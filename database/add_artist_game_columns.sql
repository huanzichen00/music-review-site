USE music_review;

SET @sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'music_review'
          AND TABLE_NAME = 'artists'
          AND COLUMN_NAME = 'genre'
    ),
    'SELECT ''Column genre already exists''',
    'ALTER TABLE artists ADD COLUMN genre VARCHAR(80) NULL COMMENT ''乐队风格'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'music_review'
          AND TABLE_NAME = 'artists'
          AND COLUMN_NAME = 'member_count'
    ),
    'SELECT ''Column member_count already exists''',
    'ALTER TABLE artists ADD COLUMN member_count INT NULL COMMENT ''成员人数'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
    EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'music_review'
          AND TABLE_NAME = 'artists'
          AND COLUMN_NAME = 'status'
    ),
    'SELECT ''Column status already exists''',
    'ALTER TABLE artists ADD COLUMN status VARCHAR(20) NULL COMMENT ''状态: 活跃/解散'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
