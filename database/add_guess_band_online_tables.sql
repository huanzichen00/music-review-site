USE music_review;

CREATE TABLE IF NOT EXISTS guess_band_online_rooms (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(16) NOT NULL UNIQUE,
    invite_token VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    question_bank_id BIGINT,
    target_artist_id BIGINT,
    owner_user_id BIGINT,
    owner_player_token VARCHAR(64) NOT NULL,
    max_attempts INT NOT NULL DEFAULT 10,
    started_at DATETIME,
    finished_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_bank_id) REFERENCES question_banks(id) ON DELETE SET NULL,
    FOREIGN KEY (target_artist_id) REFERENCES artists(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_guess_band_online_rooms_status ON guess_band_online_rooms(status);
CREATE INDEX idx_guess_band_online_rooms_created_at ON guess_band_online_rooms(created_at);

CREATE TABLE IF NOT EXISTS guess_band_online_players (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    player_token VARCHAR(64) NOT NULL,
    user_id BIGINT,
    display_name VARCHAR(80) NOT NULL,
    seat_index INT NOT NULL,
    is_ready BOOLEAN NOT NULL DEFAULT FALSE,
    last_seen_at DATETIME,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uk_guess_band_room_player_token UNIQUE (room_id, player_token),
    FOREIGN KEY (room_id) REFERENCES guess_band_online_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_guess_band_online_players_room ON guess_band_online_players(room_id);
CREATE INDEX idx_guess_band_online_players_user ON guess_band_online_players(user_id);

CREATE TABLE IF NOT EXISTS guess_band_online_guesses (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    player_id BIGINT NOT NULL,
    guessed_artist_id BIGINT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES guess_band_online_rooms(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES guess_band_online_players(id) ON DELETE CASCADE,
    FOREIGN KEY (guessed_artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

CREATE INDEX idx_guess_band_online_guesses_room ON guess_band_online_guesses(room_id);
CREATE INDEX idx_guess_band_online_guesses_player ON guess_band_online_guesses(player_id);
CREATE INDEX idx_guess_band_online_guesses_created_at ON guess_band_online_guesses(created_at);

CREATE TABLE IF NOT EXISTS guess_band_online_match_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_code VARCHAR(16) NOT NULL,
    question_bank_id BIGINT,
    host_display_name VARCHAR(80) NOT NULL,
    guest_display_name VARCHAR(80) NOT NULL,
    winner_display_name VARCHAR(80),
    total_guesses INT NOT NULL DEFAULT 0,
    started_at DATETIME,
    finished_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_bank_id) REFERENCES question_banks(id) ON DELETE SET NULL
);

CREATE INDEX idx_guess_band_online_records_created_at ON guess_band_online_match_records(created_at);
