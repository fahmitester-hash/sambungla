-- Users & Auth (Auth.js Compatible)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    emailVerified DATETIME,
    image TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    providerAccountId TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expires DATETIME NOT NULL,
    sessionToken TEXT UNIQUE NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Core SaaS Business Logic
CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY,
    userId TEXT UNIQUE NOT NULL,
    industry TEXT,
    targetAudience TEXT,
    styleProfile TEXT,             -- learned writing-style guide
    styleSampleCount INTEGER DEFAULT 0, -- how many samples fed it
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE posts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    rawPrompt TEXT,
    generatedContent TEXT NOT NULL,
    toneUsed TEXT NOT NULL, -- 'corporate-en', 'humble-local', 'manglish'
    status TEXT DEFAULT 'draft', -- 'draft','queued','published','failed','needs_reauth'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE scheduling_queue (
    id TEXT PRIMARY KEY,
    postId TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    scheduledFor DATETIME NOT NULL,
    executedAt DATETIME,
    status TEXT DEFAULT 'pending', -- 'pending','success','failed','needs_reauth'
    FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Writing style memory
CREATE TABLE writing_samples (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL, -- 'manual' | 'auto'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Swipe file (user-curated inspiration, kept separate from style memory)
CREATE TABLE swipe_file (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    content TEXT NOT NULL,
    note TEXT,
    source TEXT DEFAULT 'manual', -- 'manual' | 'own_post'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
