-- ============================================================
-- WA-C1 Migration: wa-c1-learning-hub
-- SAFE: Additive only — no DROP, no TRUNCATE, no DELETE
-- ============================================================
-- HOW TO RUN:
--   1. Open https://supabase.com/dashboard
--   2. Select your NitinChatBot project
--   3. Go to "SQL Editor" in the left sidebar
--   4. Paste this entire script and click "Run"
-- ============================================================

-- Step 1: study_collections (created FIRST — learning_notes has a FK to it)
CREATE TABLE IF NOT EXISTS study_collections (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: learning_notes (references study_collections)
CREATE TABLE IF NOT EXISTS learning_notes (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  content       TEXT NOT NULL,
  collection_id BIGINT REFERENCES study_collections(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Enable Row Level Security (same pattern as existing tables)
ALTER TABLE study_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_notes    ENABLE ROW LEVEL SECURITY;

-- Step 4: Open policies (backend uses service key — same as existing courses/queries)
CREATE POLICY "Allow all access to study_collections"
  ON study_collections FOR ALL USING (true);

CREATE POLICY "Allow all access to learning_notes"
  ON learning_notes FOR ALL USING (true);
