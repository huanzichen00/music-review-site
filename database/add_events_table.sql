USE music_review;

CREATE TABLE IF NOT EXISTS events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL,
    page VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) DEFAULT NULL,
    ip VARCHAR(64) DEFAULT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_events_type_time (event_type, created_at),
    INDEX idx_events_page_time (page, created_at),
    INDEX idx_events_user_time (user_id, created_at)
) COMMENT '极简用户行为事件表';
