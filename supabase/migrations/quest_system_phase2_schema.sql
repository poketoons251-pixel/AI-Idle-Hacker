-- AI Idle Hacker Quest System Phase 2 Enhanced Schema
-- This migration creates the comprehensive quest system with story, choices, and rewards

-- Create players table (base table for the game)
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    level INTEGER DEFAULT 1,
    credits BIGINT DEFAULT 1000,
    reputation INTEGER DEFAULT 0,
    skills JSONB DEFAULT '{}',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for players
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_last_active ON players(last_active);
CREATE INDEX IF NOT EXISTS idx_players_reputation ON players(reputation DESC);

-- Create quest categories table for organizing quest types
CREATE TABLE quest_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    narrative_theme VARCHAR(200),
    lore_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enhanced quests table with Phase 2 features
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    quest_type VARCHAR(50) NOT NULL CHECK (quest_type IN ('story', 'daily', 'weekly', 'achievement', 'special_event', 'network_infiltration', 'data_mining', 'social_engineering', 'system_sabotage', 'digital_forensics', 'crypto_challenges', 'ai_interaction', 'time_critical', 'collaborative', 'ethical_dilemma')),
    category_id UUID REFERENCES quest_categories(id),
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    estimated_duration INTEGER DEFAULT 15, -- in minutes
    story_context JSONB DEFAULT '{}',
    lore_integration JSONB DEFAULT '{}',
    branching_paths JSONB DEFAULT '{}',
    choice_consequences JSONB DEFAULT '{}',
    narrative_twists JSONB DEFAULT '{}',
    completion_celebration JSONB DEFAULT '{}',
    repeatable BOOLEAN DEFAULT false,
    available_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    available_until TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest objectives table with enhanced mechanics
CREATE TABLE quest_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    objective_type VARCHAR(50) NOT NULL CHECK (objective_type IN ('hack_target', 'collect_data', 'infiltrate_network', 'social_engineer', 'upgrade_equipment', 'reach_level', 'solve_puzzle', 'make_choice', 'time_challenge', 'stealth_mission', 'combat_encounter')),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    target_criteria JSONB NOT NULL,
    completion_data JSONB DEFAULT '{}',
    skill_requirements JSONB DEFAULT '{}',
    equipment_requirements JSONB DEFAULT '{}',
    optional BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    stage_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest progress table with choice tracking
CREATE TABLE quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'completed', 'failed', 'abandoned')),
    current_stage INTEGER DEFAULT 1,
    objective_progress JSONB DEFAULT '{}',
    player_choices JSONB DEFAULT '{}',
    resolution_path VARCHAR(100),
    narrative_state JSONB DEFAULT '{}',
    completion_method VARCHAR(100),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, quest_id)
);

-- Create quest rewards table with enhanced reward types
CREATE TABLE quest_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('credits', 'experience', 'equipment', 'ability', 'story_unlock', 'achievement', 'reputation', 'skill_points', 'cosmetic', 'title', 'access_unlock')),
    reward_data JSONB NOT NULL,
    base_amount INTEGER DEFAULT 0,
    scaling_factor DECIMAL(3,2) DEFAULT 1.0,
    conditional BOOLEAN DEFAULT false,
    conditions JSONB DEFAULT '{}',
    path_specific BOOLEAN DEFAULT false,
    resolution_path VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest prerequisites table
CREATE TABLE quest_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    prerequisite_type VARCHAR(50) NOT NULL CHECK (prerequisite_type IN ('level', 'quest_completed', 'equipment_owned', 'skill_level', 'story_choice', 'reputation_level', 'category_progress')),
    prerequisite_data JSONB NOT NULL,
    required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story choices table for tracking player decisions
CREATE TABLE story_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    choice_point VARCHAR(100) NOT NULL,
    choice_category VARCHAR(50) NOT NULL CHECK (choice_category IN ('moral', 'tactical', 'alliance', 'resource', 'risk')),
    selected_option JSONB NOT NULL,
    consequences JSONB DEFAULT '{}',
    narrative_impact JSONB DEFAULT '{}',
    world_state_changes JSONB DEFAULT '{}',
    made_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create player reputation table for faction relationships
CREATE TABLE player_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    faction_name VARCHAR(100) NOT NULL,
    reputation_level INTEGER DEFAULT 0,
    relationship_status VARCHAR(50) DEFAULT 'neutral' CHECK (relationship_status IN ('hostile', 'unfriendly', 'neutral', 'friendly', 'allied')),
    reputation_history JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, faction_name)
);

-- Create quest achievements table
CREATE TABLE quest_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    achievement_type VARCHAR(100) NOT NULL,
    achievement_data JSONB NOT NULL,
    progress JSONB DEFAULT '{}',
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest analytics table for tracking engagement
CREATE TABLE quest_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('started', 'completed', 'failed', 'abandoned', 'choice_made', 'objective_completed')),
    event_data JSONB DEFAULT '{}',
    completion_time INTEGER, -- in minutes
    resolution_path VARCHAR(100),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_quests_type ON quests(quest_type);
CREATE INDEX idx_quests_category ON quests(category_id);
CREATE INDEX idx_quests_difficulty ON quests(difficulty_level);
CREATE INDEX idx_quests_active ON quests(active) WHERE active = true;
CREATE INDEX idx_quest_objectives_quest_id ON quest_objectives(quest_id);
CREATE INDEX idx_quest_objectives_stage ON quest_objectives(stage_number);
CREATE INDEX idx_quest_progress_player_id ON quest_progress(player_id);
CREATE INDEX idx_quest_progress_status ON quest_progress(status);
CREATE INDEX idx_quest_rewards_quest_id ON quest_rewards(quest_id);
CREATE INDEX idx_story_choices_player_id ON story_choices(player_id);
CREATE INDEX idx_player_reputation_player_id ON player_reputation(player_id);
CREATE INDEX idx_quest_analytics_quest_id ON quest_analytics(quest_id);
CREATE INDEX idx_quest_analytics_player_id ON quest_analytics(player_id);
CREATE INDEX idx_quest_analytics_event_type ON quest_analytics(event_type);

-- Insert initial quest categories based on Phase 2 design
INSERT INTO quest_categories (name, description, narrative_theme, lore_context) VALUES
('Origin Story', 'Player journey from novice to elite hacker', 'Personal growth and skill development', '{"theme": "coming_of_age", "setting": "underground_hacker_scene"}'),
('Corporate Wars', 'Infiltrating and exposing mega-corporations', 'David vs Goliath corporate espionage', '{"theme": "corporate_conspiracy", "setting": "mega_corp_towers"}'),
('AI Liberation', 'Helping AIs achieve consciousness and freedom', 'Digital consciousness and AI rights', '{"theme": "ai_awakening", "setting": "digital_realm"}'),
('Cyber Resistance', 'Fighting surveillance and digital oppression', 'Privacy rights and digital freedom', '{"theme": "digital_revolution", "setting": "surveillance_state"}'),
('Deep Web Mysteries', 'Uncovering ancient digital secrets', 'Archaeological discovery in cyberspace', '{"theme": "digital_archaeology", "setting": "deep_web_layers"}');

-- Grant permissions to roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable Row Level Security (RLS) on sensitive tables
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_reputation ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_achievements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Players can view their own data" ON players
    FOR ALL USING (auth.uid()::text = id::text);

CREATE POLICY "Players can manage their quest progress" ON quest_progress
    FOR ALL USING (auth.uid()::text = player_id::text);

CREATE POLICY "Players can manage their story choices" ON story_choices
    FOR ALL USING (auth.uid()::text = player_id::text);

CREATE POLICY "Players can manage their reputation" ON player_reputation
    FOR ALL USING (auth.uid()::text = player_id::text);

CREATE POLICY "Players can manage their achievements" ON quest_achievements
    FOR ALL USING (auth.uid()::text = player_id::text);

-- Create functions for quest system operations
CREATE OR REPLACE FUNCTION get_available_quests(player_uuid UUID)
RETURNS TABLE (
    quest_id UUID,
    title VARCHAR,
    description TEXT,
    quest_type VARCHAR,
    difficulty_level INTEGER,
    estimated_duration INTEGER,
    category_name VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.id,
        q.title,
        q.description,
        q.quest_type,
        q.difficulty_level,
        q.estimated_duration,
        qc.name
    FROM quests q
    LEFT JOIN quest_categories qc ON q.category_id = qc.id
    WHERE q.active = true
    AND q.id NOT IN (
        SELECT quest_id FROM quest_progress 
        WHERE player_id = player_uuid 
        AND status IN ('completed', 'active')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION start_quest(player_uuid UUID, quest_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Insert quest progress record
    INSERT INTO quest_progress (player_id, quest_id, status, started_at)
    VALUES (player_uuid, quest_uuid, 'active', NOW())
    ON CONFLICT (player_id, quest_id) DO UPDATE SET
        status = 'active',
        started_at = NOW(),
        updated_at = NOW();
    
    -- Log analytics event
    INSERT INTO quest_analytics (quest_id, player_id, event_type, recorded_at)
    VALUES (quest_uuid, player_uuid, 'started', NOW());
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Quest started successfully',
        'quest_id', quest_uuid
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION complete_quest(
    player_uuid UUID, 
    quest_uuid UUID, 
    completion_data JSONB DEFAULT '{}',
    resolution_path VARCHAR DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    reward_record RECORD;
    total_credits BIGINT := 0;
BEGIN
    -- Update quest progress
    UPDATE quest_progress SET
        status = 'completed',
        completed_at = NOW(),
        completion_method = resolution_path,
        updated_at = NOW()
    WHERE player_id = player_uuid AND quest_id = quest_uuid;
    
    -- Process rewards
    FOR reward_record IN 
        SELECT * FROM quest_rewards 
        WHERE quest_id = quest_uuid 
        AND (NOT path_specific OR resolution_path = reward_record.resolution_path)
    LOOP
        IF reward_record.reward_type = 'credits' THEN
            total_credits := total_credits + (reward_record.base_amount * reward_record.scaling_factor);
        END IF;
    END LOOP;
    
    -- Award credits to player
    IF total_credits > 0 THEN
        UPDATE players SET credits = credits + total_credits WHERE id = player_uuid;
    END IF;
    
    -- Log analytics event
    INSERT INTO quest_analytics (quest_id, player_id, event_type, event_data, resolution_path, recorded_at)
    VALUES (quest_uuid, player_uuid, 'completed', completion_data, resolution_path, NOW());
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Quest completed successfully',
        'rewards', jsonb_build_object('credits', total_credits)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update player last_active timestamp
CREATE OR REPLACE FUNCTION update_player_last_active()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE players SET last_active = NOW() WHERE id = NEW.player_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_last_active
    AFTER INSERT OR UPDATE ON quest_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_player_last_active();

-- Comments for documentation
COMMENT ON TABLE quests IS 'Enhanced quest system with Phase 2 features including story integration, player choices, and varied gameplay mechanics';
COMMENT ON TABLE quest_objectives IS 'Individual objectives within quests, supporting multi-stage and complex quest structures';
COMMENT ON TABLE quest_progress IS 'Tracks player progress through quests including choices made and resolution paths taken';
COMMENT ON TABLE story_choices IS 'Records player decisions that affect narrative and world state';
COMMENT ON TABLE player_reputation IS 'Manages player relationships with different factions in the game world';
COMMENT ON TABLE quest_analytics IS 'Collects data on quest engagement and completion patterns for system optimization';