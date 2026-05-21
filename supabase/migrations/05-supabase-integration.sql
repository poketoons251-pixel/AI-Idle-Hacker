-- Phase 5: Supabase Integration — v1 Database Migration
-- Creates player_profiles, game_saves, and global_leaderboards tables
-- with RLS policies, realtime publication, and updated_at triggers.
--
-- Per D-05: v1 scope only — player, auth, hacking, and sync tables.
-- No guilds, companions, marketplace, or social features.

-- ============================================================
-- Table 1: player_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS player_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL DEFAULT 'Anonymous',
  level INTEGER DEFAULT 1,
  reputation INTEGER DEFAULT 0,
  total_credits BIGINT DEFAULT 0,
  operations_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Table 2: game_saves (per D-02 — full state sync)
-- One save per player (last-write-wins)
-- ============================================================
CREATE TABLE IF NOT EXISTS game_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  save_data JSONB NOT NULL,
  device_info JSONB DEFAULT '{}',
  save_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- One save per player (last-write-wins per D-02)
CREATE UNIQUE INDEX idx_game_saves_player ON game_saves(player_id);

-- ============================================================
-- Table 3: global_leaderboards (per D-03 — leaderboards only for realtime)
-- ============================================================
CREATE TABLE IF NOT EXISTS global_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  reputation INTEGER DEFAULT 0,
  total_credits BIGINT DEFAULT 0,
  operations_completed INTEGER DEFAULT 0,
  category TEXT DEFAULT 'overall',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, category)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_global_leaderboards_score ON global_leaderboards(category, score DESC);
CREATE INDEX IF NOT EXISTS idx_global_leaderboards_player ON global_leaderboards(player_id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_leaderboards ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: player_profiles
-- SELECT for all (public read), INSERT/UPDATE/DELETE only for owner
-- ============================================================
CREATE POLICY "player_profiles public read"
  ON player_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "player_profiles owner insert"
  ON player_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "player_profiles owner update"
  ON player_profiles
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "player_profiles owner delete"
  ON player_profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================================
-- RLS Policies: game_saves
-- SELECT/INSERT/UPDATE/DELETE only for auth.uid() = player_id
-- ============================================================
CREATE POLICY "game_saves owner select"
  ON game_saves
  FOR SELECT
  USING (auth.uid() = player_id);

CREATE POLICY "game_saves owner insert"
  ON game_saves
  FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "game_saves owner update"
  ON game_saves
  FOR UPDATE
  USING (auth.uid() = player_id);

CREATE POLICY "game_saves owner delete"
  ON game_saves
  FOR DELETE
  USING (auth.uid() = player_id);

-- ============================================================
-- RLS Policies: global_leaderboards
-- SELECT for all (public read), INSERT/UPDATE/DELETE only for owner
-- ============================================================
CREATE POLICY "global_leaderboards public read"
  ON global_leaderboards
  FOR SELECT
  USING (true);

CREATE POLICY "global_leaderboards owner insert"
  ON global_leaderboards
  FOR INSERT
  WITH CHECK (auth.uid() = player_id);

CREATE POLICY "global_leaderboards owner update"
  ON global_leaderboards
  FOR UPDATE
  USING (auth.uid() = player_id);

CREATE POLICY "global_leaderboards owner delete"
  ON global_leaderboards
  FOR DELETE
  USING (auth.uid() = player_id);

-- ============================================================
-- Grant permissions
-- ============================================================
GRANT SELECT ON player_profiles TO anon;
GRANT SELECT ON global_leaderboards TO anon;

GRANT ALL PRIVILEGES ON player_profiles TO authenticated;
GRANT ALL PRIVILEGES ON game_saves TO authenticated;
GRANT ALL PRIVILEGES ON global_leaderboards TO authenticated;

-- ============================================================
-- Enable Realtime publication for global_leaderboards
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE global_leaderboards;

-- ============================================================
-- Trigger: update_updated_at_column
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_player_profiles_updated_at
  BEFORE UPDATE ON player_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_saves_updated_at
  BEFORE UPDATE ON game_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_leaderboards_updated_at
  BEFORE UPDATE ON global_leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration completed successfully
SELECT 'Phase 5 Supabase Integration migration completed successfully!' as status;
