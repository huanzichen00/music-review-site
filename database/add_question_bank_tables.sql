USE music_review;

CREATE TABLE IF NOT EXISTS question_banks (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
    share_token VARCHAR(64) NOT NULL UNIQUE,
    owner_user_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_question_banks_owner_user FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
) COMMENT '猜乐队自选题库';

CREATE TABLE IF NOT EXISTS question_bank_items (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    question_bank_id BIGINT NOT NULL,
    artist_id BIGINT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_question_bank_artist UNIQUE (question_bank_id, artist_id),
    CONSTRAINT fk_question_bank_items_bank FOREIGN KEY (question_bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
    CONSTRAINT fk_question_bank_items_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
) COMMENT '猜乐队题库-乐队关联';

CREATE INDEX idx_question_banks_owner ON question_banks(owner_user_id);
CREATE INDEX idx_question_banks_visibility ON question_banks(visibility);
CREATE INDEX idx_question_bank_items_bank ON question_bank_items(question_bank_id);
CREATE INDEX idx_question_bank_items_artist ON question_bank_items(artist_id);
