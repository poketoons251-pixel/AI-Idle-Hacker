-- Episodic Campaign System Schema for Phase 3
-- This schema supports structured story content delivery with episodic progression

-- Campaign Episodes Table
-- Stores individual episodes within story campaigns
CREATE TABLE IF NOT EXISTS campaign_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR(100) NOT NULL, -- Campaign identifier (e.g., 'shadow_protocol', 'corporate_infiltration')
    episode_number INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Episode content including dialogue, choices, and narrative
    unlock_requirements JSONB, -- Requirements to unlock this episode
    rewards JSONB, -- Rewards for completing the episode
    difficulty_level INTEGER DEFAULT 1,
    estimated_duration INTEGER, -- Estimated completion time in minutes
    tags TEXT[], -- Tags for categorization
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(campaign_id, episode_number)
);

-- Campaign Progress Table
-- Tracks player progress through episodic campaigns
CREATE TABLE IF NOT EXISTS campaign_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    campaign_id VARCHAR(100) NOT NULL,
    current_episode INTEGER DEFAULT 1,
    episodes_completed INTEGER DEFAULT 0,
    total_episodes INTEGER DEFAULT 0,
    campaign_status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'paused'
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    last_played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_playtime INTEGER DEFAULT 0, -- Total time spent in minutes
    choices_made JSONB DEFAULT '[]'::jsonb, -- Record of player choices
    achievements JSONB DEFAULT '[]'::jsonb, -- Campaign-specific achievements
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, campaign_id)
);

-- Episode Unlocks Table
-- Manages episode unlock conditions and player access
CREATE TABLE IF NOT EXISTS episode_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    campaign_id VARCHAR(100) NOT NULL,
    episode_number INTEGER NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unlock_method VARCHAR(100), -- 'progression', 'achievement', 'time_based', 'manual'
    unlock_data JSONB, -- Additional data about how it was unlocked
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    completion_data JSONB, -- Data about how the episode was completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, campaign_id, episode_number)
);

-- Episode Delivery Schedule Table
-- Manages timed content delivery for idle gameplay
CREATE TABLE IF NOT EXISTS episode_delivery_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    campaign_id VARCHAR(100) NOT NULL,
    episode_number INTEGER NOT NULL,
    scheduled_unlock_at TIMESTAMP WITH TIME ZONE NOT NULL,
    delivery_method VARCHAR(50) DEFAULT 'time_based', -- 'time_based', 'progress_based', 'event_based'
    delivery_conditions JSONB, -- Conditions that must be met for delivery
    is_delivered BOOLEAN DEFAULT false,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, campaign_id, episode_number)
);

-- Campaign Metadata Table
-- Stores campaign-level information and configuration
CREATE TABLE IF NOT EXISTS campaign_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    theme VARCHAR(100), -- 'cyberpunk', 'corporate', 'underground', etc.
    total_episodes INTEGER NOT NULL,
    difficulty_rating INTEGER DEFAULT 1,
    estimated_total_duration INTEGER, -- Total campaign duration in minutes
    prerequisites JSONB, -- Requirements to start the campaign
    rewards JSONB, -- Campaign completion rewards
    is_premium BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    release_schedule JSONB, -- Episode release timing
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_episodes_campaign_id ON campaign_episodes(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_episodes_episode_number ON campaign_episodes(episode_number);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_player_id ON campaign_progress(player_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_campaign_id ON campaign_progress(campaign_id);
CREATE INDEX IF NOT EXISTS idx_episode_unlocks_player_id ON episode_unlocks(player_id);
CREATE INDEX IF NOT EXISTS idx_episode_unlocks_campaign_id ON episode_unlocks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_episode_delivery_schedule_player_id ON episode_delivery_schedule(player_id);
CREATE INDEX IF NOT EXISTS idx_episode_delivery_schedule_scheduled_unlock ON episode_delivery_schedule(scheduled_unlock_at);
CREATE INDEX IF NOT EXISTS idx_campaign_metadata_campaign_id ON campaign_metadata(campaign_id);

-- Enable Row Level Security
ALTER TABLE campaign_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_delivery_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_episodes (public read, admin write)
CREATE POLICY "Allow public read access to campaign episodes" ON campaign_episodes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow authenticated users to read campaign episodes" ON campaign_episodes
    FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for campaign_progress (user-specific)
CREATE POLICY "Users can view their own campaign progress" ON campaign_progress
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can update their own campaign progress" ON campaign_progress
    FOR UPDATE USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own campaign progress" ON campaign_progress
    FOR INSERT WITH CHECK (player_id = auth.uid());

-- RLS Policies for episode_unlocks (user-specific)
CREATE POLICY "Users can view their own episode unlocks" ON episode_unlocks
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can update their own episode unlocks" ON episode_unlocks
    FOR UPDATE USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own episode unlocks" ON episode_unlocks
    FOR INSERT WITH CHECK (player_id = auth.uid());

-- RLS Policies for episode_delivery_schedule (user-specific)
CREATE POLICY "Users can view their own delivery schedule" ON episode_delivery_schedule
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can update their own delivery schedule" ON episode_delivery_schedule
    FOR UPDATE USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own delivery schedule" ON episode_delivery_schedule
    FOR INSERT WITH CHECK (player_id = auth.uid());

-- RLS Policies for campaign_metadata (public read)
CREATE POLICY "Allow public read access to campaign metadata" ON campaign_metadata
    FOR SELECT USING (is_active = true);

-- Insert sample episodic campaign data
INSERT INTO campaign_metadata (campaign_id, title, description, theme, total_episodes, difficulty_rating, estimated_total_duration, prerequisites, rewards, release_schedule) VALUES
('shadow_protocol', 'Shadow Protocol', 'A deep dive into the underground hacking collective that operates in the shadows of the corporate world.', 'cyberpunk', 8, 3, 240, '{"level": 10, "skills": ["hacking", "stealth"]}', '{"xp": 5000, "credits": 10000, "items": ["shadow_cloak", "encrypted_drive"]}', '{"type": "weekly", "interval": 7}'),
('corporate_infiltration', 'Corporate Infiltration', 'Infiltrate the mega-corporations and uncover their darkest secrets from within.', 'corporate', 10, 4, 300, '{"level": 15, "reputation": 500}', '{"xp": 7500, "credits": 15000, "items": ["corporate_id", "executive_access"]}', '{"type": "bi_weekly", "interval": 14}'),
('digital_underground', 'Digital Underground', 'Navigate the hidden networks and encrypted channels of the digital underground.', 'underground', 6, 2, 180, '{"level": 5, "skills": ["networking"]}', '{"xp": 3000, "credits": 7500, "items": ["network_mapper", "encryption_key"]}', '{"type": "daily", "interval": 1}');

INSERT INTO campaign_episodes (campaign_id, episode_number, title, description, content, unlock_requirements, rewards, difficulty_level, estimated_duration, tags) VALUES
('shadow_protocol', 1, 'First Contact', 'Your first encounter with the Shadow Protocol collective.', '{"type": "narrative", "scenes": [{"id": "intro", "text": "A mysterious message appears on your terminal...", "choices": [{"id": "accept", "text": "Accept the invitation"}, {"id": "ignore", "text": "Ignore the message"}]}]}', '{}', '{"xp": 500, "credits": 1000}', 1, 30, '{intro,mystery}'),
('shadow_protocol', 2, 'The Initiation', 'Prove your worth to join the Shadow Protocol.', '{"type": "challenge", "tasks": [{"id": "hack_test", "description": "Complete the hacking challenge", "difficulty": 2}]}', '{"episodes_completed": 1}', '{"xp": 750, "credits": 1500}', 2, 45, '{challenge,hacking}'),
('corporate_infiltration', 1, 'Inside Job', 'Begin your infiltration of MegaCorp Industries.', '{"type": "stealth", "objectives": [{"id": "get_id", "description": "Obtain a corporate ID badge"}]}', '{}', '{"xp": 600, "credits": 1200}', 2, 35, '{stealth,corporate}'),
('digital_underground', 1, 'Deep Web Entry', 'Access the hidden networks of the digital underground.', '{"type": "exploration", "locations": [{"id": "hidden_forum", "name": "The Encrypted Forum"}]}', '{}', '{"xp": 400, "credits": 800}', 1, 25, '{exploration,networking}');

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON campaign_episodes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON campaign_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON episode_unlocks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON episode_delivery_schedule TO authenticated;
GRANT SELECT ON campaign_metadata TO authenticated;

-- Grant permissions to anon users (limited read access)
GRANT SELECT ON campaign_metadata TO anon;
GRANT SELECT ON campaign_episodes TO anon;