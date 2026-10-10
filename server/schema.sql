-- ================================================================
-- PostgreSQL Schema for Your Path
-- Provides cross-device user accounts and progress persistence
-- ================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT '',
  country VARCHAR(100) DEFAULT 'Philippines (+63)',
  grade VARCHAR(100) DEFAULT 'Grade 10',
  age VARCHAR(20) DEFAULT '',
  school VARCHAR(255) DEFAULT '',
  target_country VARCHAR(100) DEFAULT 'Domestic / Home Country',
  budget VARCHAR(100) DEFAULT 'Full scholarship needed',
  goals TEXT DEFAULT '',
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for instant email lookups during login
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. User Progress Table (Tracks questionnaire progress, answers, saved pathways, experiments, and notes)
CREATE TABLE IF NOT EXISTS user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}'::jsonb,
  saved_pathways JSONB DEFAULT '[]'::jsonb,
  saved_notes JSONB DEFAULT '{}'::jsonb,
  experiments JSONB DEFAULT '{}'::jsonb,
  session_data JSONB DEFAULT '{}'::jsonb,
  q_index INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index on user_id in user_progress
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

