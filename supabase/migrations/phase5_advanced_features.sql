-- Phase 5 Advanced Features Database Migration
-- This migration creates tables for special events, difficulty scaling, competitive leaderboards, and performance analytics

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- Special Events System Tables
CREATE TABLE IF NOT EXISTS special_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- 'limited_time', 'seasonal', 'community'
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    requirements JSONB DEFAULT '{}', -- Prerequisites for participation
    rewards JSONB DEFAULT '{}', -- Event rewards structure
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_participation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES special_events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL, -- References auth.users
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    progress JSONB DEFAULT '{}', -- Player's progress in the event
    score INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    rewards_claimed BOOLEAN DEFAULT false,
    UNIQUE(event_id, player_id)
);

CREATE TABLE IF NOT EXISTS event_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES special_events(id) ON DELETE CASCADE,
    player_id UUID NOT NULL, -- References auth.users
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    achievements JSONB DEFAULT '[]',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, player_id)
);

-- Difficulty Scaling System Tables
CREATE TABLE IF NOT EXISTS player_difficulty_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL UNIQUE, -- References auth.users
    skill_level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage of quests completed
    average_completion_time INTEGER DEFAULT 0, -- In seconds
    preferred_difficulty VARCHAR(20) DEFAULT 'normal', -- 'easy', 'normal', 'hard', 'expert'
    adaptive_scaling BOOLEAN DEFAULT true,
    last_assessment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quest_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL, -- References existing quests table
    prerequisite_type VARCHAR(50) NOT NULL, -- 'quest', 'skill_level', 'achievement'
    prerequisite_id VARCHAR(255) NOT NULL, -- ID of the prerequisite
    minimum_value INTEGER DEFAULT 1, -- Minimum level/count required
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scaled_quest_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    base_quest_id UUID NOT NULL, -- References existing quests table
    player_id UUID NOT NULL, -- References auth.users
    difficulty_modifier DECIMAL(3,2) DEFAULT 1.00, -- Multiplier for difficulty
    reward_modifier DECIMAL(3,2) DEFAULT 1.00, -- Multiplier for rewards
    time_limit_modifier DECIMAL(3,2) DEFAULT 1.00, -- Multiplier for time limits
    custom_parameters JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(base_quest_id, player_id)
);

-- Performance Analytics Tables
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    metric_type VARCHAR(50) NOT NULL, -- 'quest_completion', 'skill_improvement', 'engagement'
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,2) NOT NULL,
    measurement_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    context JSONB DEFAULT '{}', -- Additional context data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    session_id UUID NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'quest_start', 'quest_complete', 'skill_use', 'item_purchase'
    action_details JSONB DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_seconds INTEGER, -- For actions with duration
    success BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Competitive Leaderboards Tables
CREATE TABLE IF NOT EXISTS global_leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leaderboard_type VARCHAR(50) NOT NULL, -- 'overall', 'weekly', 'monthly', 'seasonal'
    player_id UUID NOT NULL, -- References auth.users
    score INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    category VARCHAR(50) DEFAULT 'general', -- 'hacking', 'intelligence', 'campaigns'
    season_id VARCHAR(50),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(leaderboard_type, player_id, category, season_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_special_events_active ON special_events(is_active, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_event_participation_player ON event_participation(player_id);
CREATE INDEX IF NOT EXISTS idx_event_participation_event ON event_participation(event_id);
CREATE INDEX IF NOT EXISTS idx_event_leaderboards_event ON event_leaderboards(event_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_player_difficulty_profiles_player ON player_difficulty_profiles(player_id);
CREATE INDEX IF NOT EXISTS idx_quest_prerequisites_quest ON quest_prerequisites(quest_id);
CREATE INDEX IF NOT EXISTS idx_scaled_quest_instances_player ON scaled_quest_instances(player_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_player ON performance_metrics(player_id, measurement_time);
CREATE INDEX IF NOT EXISTS idx_player_behavior_analytics_player ON player_behavior_analytics(player_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_global_leaderboards_type ON global_leaderboards(leaderboard_type, category, rank);

-- Enable Row Level Security on all tables
ALTER TABLE special_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participation ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_difficulty_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE scaled_quest_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_leaderboards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for special_events (public read, admin write)
CREATE POLICY "Allow public read access to active events" ON special_events
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users to read all events" ON special_events
    FOR SELECT TO authenticated USING (true);

-- Create RLS policies for event_participation (users can only see their own participation)
CREATE POLICY "Users can view their own event participation" ON event_participation
    FOR SELECT TO authenticated USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own event participation" ON event_participation
    FOR INSERT TO authenticated WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update their own event participation" ON event_participation
    FOR UPDATE TO authenticated USING (player_id = auth.uid());

-- Create RLS policies for event_leaderboards (public read)
CREATE POLICY "Allow public read access to event leaderboards" ON event_leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to update their leaderboard entries" ON event_leaderboards
    FOR ALL TO authenticated USING (player_id = auth.uid());

-- Create RLS policies for player_difficulty_profiles (users can only access their own)
CREATE POLICY "Users can access their own difficulty profile" ON player_difficulty_profiles
    FOR ALL TO authenticated USING (player_id = auth.uid());

-- Create RLS policies for quest_prerequisites (public read)
CREATE POLICY "Allow public read access to quest prerequisites" ON quest_prerequisites
    FOR SELECT USING (true);

-- Create RLS policies for scaled_quest_instances (users can only access their own)
CREATE POLICY "Users can access their own scaled quest instances" ON scaled_quest_instances
    FOR ALL TO authenticated USING (player_id = auth.uid());

-- Create RLS policies for performance_metrics (users can only access their own)
CREATE POLICY "Users can access their own performance metrics" ON performance_metrics
    FOR ALL TO authenticated USING (player_id = auth.uid());

-- Create RLS policies for player_behavior_analytics (users can only access their own)
CREATE POLICY "Users can access their own behavior analytics" ON player_behavior_analytics
    FOR ALL TO authenticated USING (player_id = auth.uid());

-- Create RLS policies for global_leaderboards (public read, authenticated write for own entries)
CREATE POLICY "Allow public read access to global leaderboards" ON global_leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to manage their leaderboard entries" ON global_leaderboards
    FOR ALL TO authenticated USING (player_id = auth.uid());

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON special_events TO anon;
GRANT SELECT ON event_leaderboards TO anon;
GRANT SELECT ON quest_prerequisites TO anon;
GRANT SELECT ON global_leaderboards TO anon;

GRANT ALL PRIVILEGES ON special_events TO authenticated;
GRANT ALL PRIVILEGES ON event_participation TO authenticated;
GRANT ALL PRIVILEGES ON event_leaderboards TO authenticated;
GRANT ALL PRIVILEGES ON player_difficulty_profiles TO authenticated;
GRANT ALL PRIVILEGES ON quest_prerequisites TO authenticated;
GRANT ALL PRIVILEGES ON scaled_quest_instances TO authenticated;
GRANT ALL PRIVILEGES ON performance_metrics TO authenticated;
GRANT ALL PRIVILEGES ON player_behavior_analytics TO authenticated;
GRANT ALL PRIVILEGES ON global_leaderboards TO authenticated;

-- Insert sample data for testing
INSERT INTO special_events (name, description, event_type, start_time, end_time, requirements, rewards) VALUES
('Cyber Security Challenge', 'Test your hacking skills in this limited-time event', 'limited_time', NOW(), NOW() + INTERVAL '7 days', '{"min_level": 5}', '{"xp": 1000, "items": ["rare_exploit"]}'),
('Winter Hacking Festival', 'Seasonal event with special winter-themed challenges', 'seasonal', NOW(), NOW() + INTERVAL '30 days', '{"min_level": 1}', '{"xp": 500, "items": ["winter_skin"]}');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
CREATE TRIGGER update_special_events_updated_at BEFORE UPDATE ON special_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_difficulty_profiles_updated_at BEFORE UPDATE ON player_difficulty_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration completed successfully
SELECT 'Phase 5 Advanced Features migration completed successfully!' as status;