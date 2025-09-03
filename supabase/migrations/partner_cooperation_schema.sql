-- Partner Cooperation and AI Companion Database Schema
-- Enables enhanced partner relationships and cooperative operations

-- AI Partners: Available AI companions with distinct personalities
CREATE TABLE ai_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    personality_type VARCHAR(50) NOT NULL, -- 'analytical', 'aggressive', 'cautious', 'social', 'technical'
    specialization VARCHAR(50) NOT NULL, -- 'cryptography', 'social_engineering', 'network_security', 'data_analysis'
    base_stats JSONB NOT NULL, -- {"intelligence": 80, "reliability": 90, "speed": 70, "stealth": 60}
    personality_traits JSONB NOT NULL, -- Behavioral characteristics
    dialogue_style JSONB NOT NULL, -- Communication patterns and phrases
    unlock_level INTEGER DEFAULT 1,
    unlock_requirements JSONB DEFAULT '{}',
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Relationships: Track player-AI partner bonds
CREATE TABLE partner_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    partner_id UUID REFERENCES ai_partners(id) ON DELETE CASCADE,
    trust_level INTEGER DEFAULT 0, -- 0-100 trust rating
    cooperation_score INTEGER DEFAULT 0, -- Successful joint operations
    relationship_status VARCHAR(20) DEFAULT 'neutral', -- 'hostile', 'neutral', 'friendly', 'trusted', 'bonded'
    total_missions INTEGER DEFAULT 0,
    successful_missions INTEGER DEFAULT 0,
    last_interaction TIMESTAMP WITH TIME ZONE,
    relationship_history JSONB DEFAULT '[]', -- Track major events
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, partner_id)
);

-- Cooperation Missions: Multi-stage collaborative operations
CREATE TABLE cooperation_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_code VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    mission_type VARCHAR(50) NOT NULL, -- 'infiltration', 'data_theft', 'sabotage', 'reconnaissance'
    difficulty_level INTEGER DEFAULT 1,
    required_partners INTEGER DEFAULT 1, -- Minimum partners needed
    max_partners INTEGER DEFAULT 3, -- Maximum partners allowed
    stages JSONB NOT NULL, -- Mission stage definitions
    rewards JSONB NOT NULL, -- Credits, items, reputation, etc.
    unlock_requirements JSONB DEFAULT '{}',
    time_limit INTEGER, -- Minutes to complete (NULL = no limit)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active Cooperation Sessions: Ongoing collaborative operations
CREATE TABLE active_cooperation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    mission_id UUID REFERENCES cooperation_missions(id) ON DELETE CASCADE,
    session_code VARCHAR(100) UNIQUE NOT NULL,
    participating_partners JSONB NOT NULL, -- Array of partner IDs
    current_stage INTEGER DEFAULT 1,
    stage_progress JSONB DEFAULT '{}', -- Progress data for current stage
    session_status VARCHAR(20) DEFAULT 'active', -- 'active', 'paused', 'completed', 'failed'
    coordination_quality DECIMAL(3,2) DEFAULT 1.0, -- How well partners are working together
    time_remaining INTEGER, -- Minutes left (if time-limited)
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Partner Communications: Dialogue and coordination messages
CREATE TABLE partner_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_cooperation_sessions(id) ON DELETE CASCADE,
    partner_id UUID REFERENCES ai_partners(id) ON DELETE CASCADE,
    message_type VARCHAR(50) NOT NULL, -- 'status_update', 'suggestion', 'warning', 'celebration', 'concern'
    message_content TEXT NOT NULL,
    message_data JSONB DEFAULT '{}', -- Additional context data
    is_player_response BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Coordination Events: Track cooperation effectiveness
CREATE TABLE partner_coordination_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES active_cooperation_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'sync_success', 'timing_failure', 'resource_share', 'conflict_resolution'
    participating_partners JSONB NOT NULL,
    event_description TEXT,
    coordination_impact DECIMAL(3,2) DEFAULT 0.0, -- -1.0 to 1.0 impact on coordination
    trust_impact JSONB DEFAULT '{}', -- Trust changes per partner
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Skill Synergies: Combination bonuses
CREATE TABLE partner_skill_synergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synergy_name VARCHAR(100) NOT NULL,
    required_partners JSONB NOT NULL, -- Array of partner specializations
    bonus_type VARCHAR(50) NOT NULL, -- 'speed', 'success_rate', 'stealth', 'reward_multiplier'
    bonus_value DECIMAL(4,2) NOT NULL, -- Multiplier or flat bonus
    description TEXT,
    unlock_requirements JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true
);

-- Create indexes for performance
CREATE INDEX idx_ai_partners_specialization ON ai_partners(specialization);
CREATE INDEX idx_ai_partners_unlock_level ON ai_partners(unlock_level);
CREATE INDEX idx_partner_relationships_player_id ON partner_relationships(player_id);
CREATE INDEX idx_partner_relationships_trust_level ON partner_relationships(trust_level);
CREATE INDEX idx_cooperation_missions_difficulty ON cooperation_missions(difficulty_level);
CREATE INDEX idx_active_cooperation_sessions_player_id ON active_cooperation_sessions(player_id);
CREATE INDEX idx_active_cooperation_sessions_status ON active_cooperation_sessions(session_status);
CREATE INDEX idx_partner_communications_session_id ON partner_communications(session_id);
CREATE INDEX idx_partner_coordination_events_session_id ON partner_coordination_events(session_id);

-- Enable Row Level Security
ALTER TABLE ai_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperation_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_cooperation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_coordination_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_skill_synergies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- AI partners and missions are viewable by authenticated users
CREATE POLICY "AI partners are viewable by authenticated users" ON ai_partners
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Cooperation missions are viewable by authenticated users" ON cooperation_missions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Partner synergies are viewable by authenticated users" ON partner_skill_synergies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Player-specific data policies
CREATE POLICY "Users can view their own partner relationships" ON partner_relationships
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage their own partner relationships" ON partner_relationships
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Users can view their own cooperation sessions" ON active_cooperation_sessions
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage their own cooperation sessions" ON active_cooperation_sessions
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Users can view communications from their sessions" ON partner_communications
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM active_cooperation_sessions acs 
        WHERE acs.id = session_id AND acs.player_id = auth.uid()
    ));

CREATE POLICY "Users can insert communications to their sessions" ON partner_communications
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM active_cooperation_sessions acs 
        WHERE acs.id = session_id AND acs.player_id = auth.uid()
    ));

CREATE POLICY "Users can view coordination events from their sessions" ON partner_coordination_events
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM active_cooperation_sessions acs 
        WHERE acs.id = session_id AND acs.player_id = auth.uid()
    ));

-- Insert sample AI partners
INSERT INTO ai_partners (partner_code, name, personality_type, specialization, base_stats, personality_traits, dialogue_style) VALUES
('cipher', 'Cipher', 'analytical', 'cryptography', 
 '{"intelligence": 95, "reliability": 90, "speed": 70, "stealth": 80}',
 '{"traits": ["methodical", "perfectionist", "logical"], "quirks": ["speaks_in_code", "loves_puzzles"]}',
 '{"style": "formal", "phrases": ["Calculating optimal approach...", "Encryption patterns detected", "Logic dictates we should..."]}'),

('ghost', 'Ghost', 'cautious', 'network_security',
 '{"intelligence": 85, "reliability": 95, "speed": 90, "stealth": 95}',
 '{"traits": ["paranoid", "thorough", "protective"], "quirks": ["checks_exits", "trusts_slowly"]}',
 '{"style": "whispered", "phrases": ["Stay in the shadows...", "Something feels off", "We need an exit strategy"]}'),

('spark', 'Spark', 'aggressive', 'social_engineering',
 '{"intelligence": 80, "reliability": 75, "speed": 95, "stealth": 60}',
 '{"traits": ["impulsive", "charismatic", "risk_taker"], "quirks": ["loves_challenges", "hates_waiting"]}',
 '{
"style": "energetic", "phrases": ["Let''s light this up!", "I can talk our way in", "Trust me on this one"]
}'),

('oracle', 'Oracle', 'social', 'data_analysis',
 '{"intelligence": 90, "reliability": 85, "speed": 80, "stealth": 70}',
 '{"traits": ["intuitive", "empathetic", "wise"], "quirks": ["predicts_outcomes", "reads_people_well"]}',
 '{"style": "mystical", "phrases": ["The data speaks to me...", "I sense a pattern", "The future is unclear, but..."]}'),

('volt', 'Volt', 'technical', 'network_security',
 '{"intelligence": 88, "reliability": 80, "speed": 85, "stealth": 75}',
 '{"traits": ["innovative", "curious", "experimental"], "quirks": ["loves_new_tech", "speaks_in_acronyms"]}',
 '{"style": "technical", "phrases": ["Initiating protocol...", "System optimization complete", "Running diagnostics..."]}');

-- Insert sample cooperation missions
INSERT INTO cooperation_missions (mission_code, title, description, mission_type, difficulty_level, required_partners, stages, rewards) VALUES
('infiltrate_megacorp', 'Corporate Infiltration', 'Penetrate MegaCorp Alpha''s secure network using coordinated social engineering and technical attacks', 'infiltration', 3, 2,
 '{"stages": [{"name": "Reconnaissance", "description": "Gather intelligence on target systems"}, {"name": "Social Engineering", "description": "Manipulate employees for access"}, {"name": "Network Penetration", "description": "Breach the secure network"}, {"name": "Data Extraction", "description": "Locate and extract valuable data"}]}',
 '{"credits": 15000, "reputation": 50, "items": ["advanced_encryption_key"], "partner_trust": 25}'),

('shadow_bank_heist', 'Digital Bank Heist', 'Coordinate a sophisticated attack on Shadow Financial Network''s transaction systems', 'data_theft', 5, 3,
 '{"stages": [{"name": "System Mapping", "description": "Map the bank''s network architecture"}, {"name": "Security Bypass", "description": "Disable security systems"}, {"name": "Transaction Intercept", "description": "Intercept and redirect transactions"}, {"name": "Clean Exit", "description": "Cover tracks and escape"}]}',
 '{"credits": 50000, "reputation": 100, "items": ["quantum_decryptor"], "partner_trust": 40}'),

('data_broker_sabotage', 'Information Warfare', 'Sabotage Zeta Data Brokerage''s operations through coordinated attacks', 'sabotage', 4, 2,
 '{"stages": [{"name": "Intelligence Gathering", "description": "Collect information on target operations"}, {"name": "System Infiltration", "description": "Gain access to critical systems"}, {"name": "Data Corruption", "description": "Corrupt key databases"}, {"name": "Reputation Damage", "description": "Leak embarrassing information"}]}',
 '{"credits": 25000, "reputation": 75, "items": ["data_corruption_virus"], "partner_trust": 30}');

-- Insert sample skill synergies
INSERT INTO partner_skill_synergies (synergy_name, required_partners, bonus_type, bonus_value, description) VALUES
('Crypto-Security Combo', '["cryptography", "network_security"]', 'success_rate', 1.25, 'Cryptography and security experts work together for enhanced protection'),
('Social-Technical Fusion', '["social_engineering", "data_analysis"]', 'speed', 1.30, 'Social manipulation combined with data insights accelerates operations'),
('Triple Threat', '["cryptography", "social_engineering", "network_security"]', 'reward_multiplier', 1.50, 'The ultimate combination of skills for maximum effectiveness'),
('Data-Security Alliance', '["data_analysis", "network_security"]', 'stealth', 1.20, 'Data analysis and security expertise improve operational stealth');