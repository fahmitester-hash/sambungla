CREATE TABLE swipe_file (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    note TEXT,
    source TEXT DEFAULT 'manual', -- 'manual' | 'own_post'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
