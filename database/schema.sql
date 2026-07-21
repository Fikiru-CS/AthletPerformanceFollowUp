-- ============================================================
-- APTS - Athlete Performance Tracking System
-- PostgreSQL Database Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,       -- bcrypt hashed
    avatar_url  VARCHAR(500),
    bio         TEXT,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLE: training_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS training_sessions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title            VARCHAR(255),
    start_point      VARCHAR(255),
    end_point        VARCHAR(255),
    distance_km      NUMERIC(8, 2) NOT NULL,
    duration_minutes NUMERIC(8, 2) NOT NULL,
    avg_speed        NUMERIC(6, 2),          -- km/h (auto-calculated)
    avg_pace         NUMERIC(6, 2),          -- min/km (auto-calculated)
    altitude         NUMERIC(8, 2),          -- meters
    temperature      NUMERIC(5, 2),          -- Celsius
    training_date    DATE NOT NULL,
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id      ON training_sessions(user_id);
CREATE INDEX idx_sessions_date         ON training_sessions(training_date);
CREATE INDEX idx_sessions_user_date    ON training_sessions(user_id, training_date);

-- ============================================================
-- TABLE: kilometer_splits
-- ============================================================
CREATE TABLE IF NOT EXISTS kilometer_splits (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id       UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    kilometer_number INTEGER NOT NULL,
    split_time       NUMERIC(8, 2) NOT NULL,   -- seconds
    split_speed      NUMERIC(6, 2),             -- km/h
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_splits_session_id ON kilometer_splits(session_id);

-- ============================================================
-- FUNCTION: auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON training_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SEED DATA (optional demo data)
-- ============================================================
-- Insert demo user (password: "password123" hashed with bcrypt)
INSERT INTO users (id, name, email, password) VALUES
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Alex Runner',
    'alex@apts.demo',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh9i'
) ON CONFLICT DO NOTHING;

-- Create password_resets table
CREATE TABLE IF NOT EXISTS password_resets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reset_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires ON password_resets(expires_at);