CREATE TABLE writing_samples (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL, -- 'manual' | 'auto'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE user_profiles ADD COLUMN styleProfile TEXT;
ALTER TABLE user_profiles ADD COLUMN styleSampleCount INTEGER DEFAULT 0;
