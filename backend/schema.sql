CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS learning_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    quiz_score INTEGER DEFAULT 0,
    diagnostic_level TEXT DEFAULT 'pendiente',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, node_id),
    FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS learner_model (
    student_id TEXT PRIMARY KEY,
    learning_goal TEXT DEFAULT '',
    prior_knowledge TEXT DEFAULT '',
    diagnostic_note TEXT DEFAULT '',
    shared_count INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    voice_profile_code TEXT DEFAULT 'tutor',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
);

CREATE TABLE IF NOT EXISTS voice_profiles (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    willingness TEXT NOT NULL,
    style TEXT NOT NULL,
    manner TEXT NOT NULL,
    mood TEXT NOT NULL,
    rate REAL DEFAULT 0.92,
    pitch REAL DEFAULT 1.0,
    prompt_rules TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tts_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text_hash TEXT UNIQUE NOT NULL,
    voice_profile_code TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);