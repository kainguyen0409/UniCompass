-- Lộ Trình Đại Học — database schema
-- Run with: psql -d lo_trinh -f server/src/schema.sql

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(100) NOT NULL,
    grade         VARCHAR(50),
    created_at    TIMESTAMP DEFAULT NOW()
);

-- The three admission routes
CREATE TABLE IF NOT EXISTS routes (
    id     VARCHAR(10) PRIMARY KEY,
    label  VARCHAR(100) NOT NULL,
    detail VARCHAR(200),
    scale  INTEGER NOT NULL
);

-- Official data sources
CREATE TABLE IF NOT EXISTS sources (
    id           VARCHAR(10) PRIMARY KEY,
    short_label  VARCHAR(10) NOT NULL,
    title        TEXT NOT NULL,
    publisher    VARCHAR(255) NOT NULL,
    url          TEXT NOT NULL,
    cycle        VARCHAR(50) NOT NULL,
    published_at VARCHAR(50),
    verified_at  VARCHAR(50),
    status       VARCHAR(20) NOT NULL,
    fields       TEXT[] NOT NULL,
    note         TEXT
);

-- Admission timeline milestones
CREATE TABLE IF NOT EXISTS milestones (
    id             VARCHAR(50) PRIMARY KEY,
    phase          VARCHAR(50) NOT NULL,
    title          TEXT NOT NULL,
    plain_language TEXT NOT NULL,
    display_date   VARCHAR(100) NOT NULL,
    route_ids      VARCHAR(10)[] NOT NULL,
    source_ids     VARCHAR(10)[] NOT NULL,
    checklist      TEXT[] NOT NULL,
    status         VARCHAR(20) NOT NULL,
    sort_order     INTEGER NOT NULL DEFAULT 1000
);

-- Add the ordering to existing demo databases without removing saved progress.
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 1000;
UPDATE milestones SET sort_order = CASE id
    WHEN 'profile-review' THEN 1
    WHEN 'priority-admission' THEN 2
    WHEN 'preference-registration' THEN 3
    WHEN 'admission-fee' THEN 4
    WHEN 'admission-result' THEN 5
    WHEN 'enrolment-confirmation' THEN 6
    ELSE sort_order
END;

-- Historical score cutoffs
CREATE TABLE IF NOT EXISTS benchmarks (
    id             VARCHAR(50) PRIMARY KEY,
    university     VARCHAR(100) NOT NULL,
    program        VARCHAR(200) NOT NULL,
    code           VARCHAR(20) NOT NULL,
    route          VARCHAR(10) REFERENCES routes(id),
    score          NUMERIC(6,2) NOT NULL,
    scale          INTEGER NOT NULL,
    benchmark_type VARCHAR(50) NOT NULL,
    cycle          VARCHAR(10) NOT NULL,
    source_id      VARCHAR(10) REFERENCES sources(id),
    note           TEXT,
    comparable     BOOLEAN DEFAULT true,
    university_id  VARCHAR(20),
    program_id     VARCHAR(100),
    campus         VARCHAR(100),
    category_ids   TEXT[] NOT NULL DEFAULT '{}',
    method_id      VARCHAR(50),
    method_label   TEXT,
    subject_groups TEXT[] NOT NULL DEFAULT '{}',
    admission_round VARCHAR(100)
);

-- Cutoff metadata is supplied by the sourced seed data; do not infer a method
-- or scale from the three routes used by the national roadmap.
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS university_id VARCHAR(20);
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS program_id VARCHAR(100);
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS campus VARCHAR(100);
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS category_ids TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS method_id VARCHAR(50);
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS method_label TEXT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS subject_groups TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS admission_round VARCHAR(100);

-- Saved progress for signed-in users
CREATE TABLE IF NOT EXISTS user_progress (
    user_id            INTEGER REFERENCES users(id) ON DELETE CASCADE,
    completed_task_ids TEXT[] DEFAULT '{}',
    scores_thpt        NUMERIC(4,2) DEFAULT 0,
    scores_hsa         INTEGER DEFAULT 0,
    scores_sat         INTEGER DEFAULT 0,
    interests          JSONB NOT NULL DEFAULT '{"universityIds":[],"categoryIds":[]}',
    updated_at         TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Keep two decimal places when users enter their THPT scores.
ALTER TABLE user_progress ALTER COLUMN scores_thpt TYPE NUMERIC(4,2);
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '{"universityIds":[],"categoryIds":[]}';
