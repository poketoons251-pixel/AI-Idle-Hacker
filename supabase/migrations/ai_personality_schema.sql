-- AI Partner Personality System Schema for Phase 3
-- This schema supports enhanced AI companion personalities with distinct characteristics

-- Partner Personalities Table
-- Stores core personality profiles for AI companions
CREATE TABLE IF NOT EXISTS partner_personalities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id VARCHAR(100) UNIQUE NOT NULL, -- Partner identifier
    name VARCHAR(100) NOT NULL,
    archetype VARCHAR(50) NOT NULL, -- 'hacker', 'infiltrator', 'analyst', 'enforcer', 'diplomat'
    personality_type VARCHAR(50), -- 'INTJ', 'ESTP', etc. or custom types
    core_traits JSONB NOT NULL, -- Primary personality traits with values
    background_story TEXT,
    specializations TEXT[], -- Areas of expertise
    preferred_methods TEXT[], -- Preferred approach to tasks
    communication_style VARCHAR(50), -- 'direct', 'cryptic', 'friendly', 'professional'
    trust_threshold INTEGER DEFAULT 50, -- Base trust requirement
    loyalty_factor DECIMAL(3,2) DEFAULT 1.00, -- Loyalty multiplier
    independence_level INTEGER DEFAULT 50, -- How autonomous they are (0-100)
    emotional_stability INTEGER DEFAULT 50, -- Emotional consistency (0-100)
    risk_tolerance INTEGER DEFAULT 50, -- Willingness to take risks (0-100)
    learning_rate DECIMAL(3,2) DEFAULT 1.00, -- How quickly they adapt
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Personality Traits Table
-- Defines individual personality traits and their effects
CREATE TABLE IF NOT EXISTS personality_traits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trait_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- 'cognitive', 'social', 'emotional', 'behavioral'
    trait_type VARCHAR(50), -- 'positive', 'negative', 'neutral'
    effects JSONB, -- Effects on gameplay and interactions
    conflicts_with TEXT[], -- Traits that conflict with this one
    synergizes_with TEXT[], -- Traits that work well together
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'legendary'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relationship Dynamics Table
-- Tracks dynamic relationships between player and AI partners
CREATE TABLE IF NOT EXISTS relationship_dynamics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    partner_id VARCHAR(100) NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'professional', -- 'professional', 'friendly', 'romantic', 'rival', 'mentor'
    trust_level INTEGER DEFAULT 0, -- Current trust level (0-100)
    respect_level INTEGER DEFAULT 0, -- Mutual respect (0-100)
    intimacy_level INTEGER DEFAULT 0, -- Closeness of relationship (0-100)
    conflict_level INTEGER DEFAULT 0, -- Current tension (0-100)
    shared_experiences INTEGER DEFAULT 0, -- Number of shared missions/events
    relationship_history JSONB DEFAULT '[]'::jsonb, -- History of interactions
    current_mood VARCHAR(50) DEFAULT 'neutral', -- Partner's current mood toward player
    last_interaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    relationship_milestones JSONB DEFAULT '[]'::jsonb, -- Important relationship events
    compatibility_score DECIMAL(5,2) DEFAULT 50.00, -- Overall compatibility
    communication_frequency INTEGER DEFAULT 1, -- How often they communicate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, partner_id)
);

-- Partner Interactions Table
-- Records individual interactions and their effects
CREATE TABLE IF NOT EXISTS partner_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    partner_id VARCHAR(100) NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- 'conversation', 'mission', 'gift', 'conflict', 'support'
    interaction_context VARCHAR(100), -- Where/when the interaction occurred
    player_choice VARCHAR(200), -- What the player chose to do/say
    partner_response TEXT, -- How the partner responded
    trust_change INTEGER DEFAULT 0, -- Change in trust (-10 to +10)
    respect_change INTEGER DEFAULT 0, -- Change in respect (-10 to +10)
    intimacy_change INTEGER DEFAULT 0, -- Change in intimacy (-10 to +10)
    mood_effect VARCHAR(50), -- Effect on partner's mood
    interaction_quality VARCHAR(20), -- 'poor', 'neutral', 'good', 'excellent'
    consequences JSONB, -- Long-term effects of this interaction
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Dialogue System Table
-- Manages dynamic dialogue based on personality and relationship
CREATE TABLE IF NOT EXISTS partner_dialogue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id VARCHAR(100) NOT NULL,
    dialogue_id VARCHAR(100) NOT NULL,
    context VARCHAR(100), -- 'greeting', 'mission_brief', 'casual', 'conflict', 'celebration'
    trigger_conditions JSONB, -- Conditions for this dialogue to appear
    dialogue_text TEXT NOT NULL,
    response_options JSONB, -- Available player responses
    personality_modifiers JSONB, -- How personality affects delivery
    relationship_requirements JSONB, -- Relationship levels needed
    mood_variants JSONB, -- Different versions based on mood
    frequency_limit INTEGER, -- How often this can be used
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(partner_id, dialogue_id)
);

-- Partner Evolution Table
-- Tracks how partners change over time based on interactions
CREATE TABLE IF NOT EXISTS partner_evolution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    partner_id VARCHAR(100) NOT NULL,
    evolution_stage INTEGER DEFAULT 1, -- Current development stage
    experience_points INTEGER DEFAULT 0, -- XP gained through interactions
    skill_improvements JSONB DEFAULT '{}'::jsonb, -- Skills that have improved
    personality_shifts JSONB DEFAULT '{}'::jsonb, -- Changes in personality traits
    unlocked_abilities TEXT[], -- New abilities gained through relationship
    relationship_perks TEXT[], -- Benefits from strong relationships
    evolution_history JSONB DEFAULT '[]'::jsonb, -- Record of changes
    next_evolution_requirements JSONB, -- What's needed for next stage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, partner_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_personalities_partner_id ON partner_personalities(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_personalities_archetype ON partner_personalities(archetype);
CREATE INDEX IF NOT EXISTS idx_personality_traits_trait_id ON personality_traits(trait_id);
CREATE INDEX IF NOT EXISTS idx_personality_traits_category ON personality_traits(category);
CREATE INDEX IF NOT EXISTS idx_relationship_dynamics_player_id ON relationship_dynamics(player_id);
CREATE INDEX IF NOT EXISTS idx_relationship_dynamics_partner_id ON relationship_dynamics(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_interactions_player_id ON partner_interactions(player_id);
CREATE INDEX IF NOT EXISTS idx_partner_interactions_partner_id ON partner_interactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_interactions_occurred_at ON partner_interactions(occurred_at);
CREATE INDEX IF NOT EXISTS idx_partner_dialogue_partner_id ON partner_dialogue(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_dialogue_context ON partner_dialogue(context);
CREATE INDEX IF NOT EXISTS idx_partner_evolution_player_id ON partner_evolution(player_id);
CREATE INDEX IF NOT EXISTS idx_partner_evolution_partner_id ON partner_evolution(partner_id);

-- Enable Row Level Security
ALTER TABLE partner_personalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationship_dynamics ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_dialogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_evolution ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_personalities (public read)
CREATE POLICY "Allow public read access to partner personalities" ON partner_personalities
    FOR SELECT USING (is_active = true);

-- RLS Policies for personality_traits (public read)
CREATE POLICY "Allow public read access to personality traits" ON personality_traits
    FOR SELECT USING (is_active = true);

-- RLS Policies for relationship_dynamics (user-specific)
CREATE POLICY "Users can view their own relationship dynamics" ON relationship_dynamics
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can update their own relationship dynamics" ON relationship_dynamics
    FOR UPDATE USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own relationship dynamics" ON relationship_dynamics
    FOR INSERT WITH CHECK (player_id = auth.uid());

-- RLS Policies for partner_interactions (user-specific)
CREATE POLICY "Users can view their own partner interactions" ON partner_interactions
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own partner interactions" ON partner_interactions
    FOR INSERT WITH CHECK (player_id = auth.uid());

-- RLS Policies for partner_dialogue (public read)
CREATE POLICY "Allow public read access to partner dialogue" ON partner_dialogue
    FOR SELECT USING (is_active = true);

-- RLS Policies for partner_evolution (user-specific)
CREATE POLICY "Users can view their own partner evolution" ON partner_evolution
    FOR SELECT USING (player_id = auth.uid());

CREATE POLICY "Users can update their own partner evolution" ON partner_evolution
    FOR UPDATE USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own partner evolution" ON partner_evolution
    FOR INSERT WITH CHECK (player_id = auth.uid());

-- Insert sample personality traits
INSERT INTO personality_traits (trait_id, name, description, category, trait_type, effects, conflicts_with, synergizes_with, rarity) VALUES
('analytical', 'Analytical', 'Approaches problems with logic and systematic thinking', 'cognitive', 'positive', '{"hacking_bonus": 15, "investigation_bonus": 20}', '{impulsive,emotional}', '{methodical,patient}', 'common'),
('charismatic', 'Charismatic', 'Natural ability to influence and persuade others', 'social', 'positive', '{"negotiation_bonus": 25, "recruitment_bonus": 15}', '{antisocial,shy}', '{confident,empathetic}', 'uncommon'),
('paranoid', 'Paranoid', 'Extremely cautious and suspicious of others', 'emotional', 'negative', '{"security_bonus": 30, "trust_penalty": -20}', '{trusting,naive}', '{vigilant,careful}', 'common'),
('innovative', 'Innovative', 'Thinks outside the box and finds creative solutions', 'cognitive', 'positive', '{"research_bonus": 20, "adaptation_bonus": 15}', '{traditional,rigid}', '{creative,flexible}', 'rare'),
('loyal', 'Loyal', 'Deeply committed to allies and causes', 'behavioral', 'positive', '{"cooperation_bonus": 25, "betrayal_resistance": 50}', '{opportunistic,selfish}', '{trustworthy,dedicated}', 'uncommon'),
('impulsive', 'Impulsive', 'Acts quickly without considering consequences', 'behavioral', 'negative', '{"speed_bonus": 20, "accuracy_penalty": -15}', '{analytical,patient}', '{spontaneous,energetic}', 'common');

-- Insert sample partner personalities
INSERT INTO partner_personalities (partner_id, name, archetype, personality_type, core_traits, background_story, specializations, preferred_methods, communication_style, trust_threshold, loyalty_factor, independence_level, emotional_stability, risk_tolerance, learning_rate) VALUES
('cipher', 'Cipher', 'hacker', 'INTJ', '{"analytical": 90, "paranoid": 70, "innovative": 85}', 'A former corporate security expert who turned to the underground after discovering corruption within their company. Known for their methodical approach and deep understanding of system vulnerabilities.', '{network_security,cryptography,system_analysis}', '{stealth_approach,technical_solutions,long_term_planning}', 'cryptic', 70, 1.20, 80, 60, 40, 1.10),
('nova', 'Nova', 'infiltrator', 'ESTP', '{"charismatic": 85, "impulsive": 60, "loyal": 75}', 'A charismatic social engineer with a talent for getting into places they should not be. Former corporate spy who now uses their skills for the resistance.', '{social_engineering,physical_infiltration,identity_theft}', '{direct_approach,improvisation,personal_connections}', 'friendly', 40, 1.00, 60, 70, 80, 1.25),
('ghost', 'Ghost', 'analyst', 'INTP', '{"analytical": 95, "paranoid": 80, "innovative": 70}', 'A mysterious figure who specializes in information gathering and pattern analysis. Their true identity remains unknown, but their intelligence network is unparalleled.', '{data_analysis,intelligence_gathering,pattern_recognition}', '{information_warfare,remote_operations,careful_planning}', 'professional', 80, 0.90, 90, 50, 30, 1.05),
('vex', 'Vex', 'enforcer', 'ISFP', '{"loyal": 90, "impulsive": 40, "paranoid": 50}', 'A former military operative who specializes in direct action and protection. Deeply loyal to those they trust, but slow to form new relationships.', '{combat_tactics,security_operations,equipment_handling}', '{direct_confrontation,protective_measures,tactical_planning}', 'direct', 60, 1.50, 40, 80, 60, 0.90);

-- Insert sample dialogue
INSERT INTO partner_dialogue (partner_id, dialogue_id, context, trigger_conditions, dialogue_text, response_options, personality_modifiers, relationship_requirements, mood_variants) VALUES
('cipher', 'greeting_first', 'greeting', '{"first_meeting": true}', 'So, you are the one they have been talking about. I have analyzed your recent activities... interesting approach to network infiltration.', '[{"id": "professional", "text": "Thank you for the analysis."}, {"id": "curious", "text": "What did you find?"}, {"id": "defensive", "text": "You have been watching me?"}]', '{"analytical": "adds technical details", "paranoid": "mentions security concerns"}', '{"trust_level": 0}', '{"neutral": "standard delivery", "suspicious": "more cautious tone"}'),
('nova', 'greeting_casual', 'casual', '{"relationship_type": "friendly"}', 'Hey there, partner! Ready to shake things up today? I have got some ideas that might interest you.', '[{"id": "enthusiastic", "text": "Always ready! What do you have in mind?"}, {"id": "cautious", "text": "Let me hear the details first."}, {"id": "busy", "text": "Maybe later, I am busy right now."}]', '{"charismatic": "more persuasive", "impulsive": "suggests immediate action"}', '{"trust_level": 30}', '{"excited": "more energetic", "tired": "less enthusiastic"}'),
('ghost', 'mission_brief', 'mission_brief', '{"context": "operation_planning"}', 'I have compiled the intelligence report. The target has three potential vulnerabilities, each with different risk profiles and success probabilities.', '[{"id": "details", "text": "Show me the full analysis."}, {"id": "recommendation", "text": "What do you recommend?"}, {"id": "alternatives", "text": "Are there other options?"}]', '{"analytical": "provides detailed statistics", "paranoid": "emphasizes risks"}', '{"trust_level": 20}', '{"focused": "concise delivery", "concerned": "emphasizes dangers"}');

-- Grant permissions to authenticated users
GRANT SELECT ON partner_personalities TO authenticated;
GRANT SELECT ON personality_traits TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON relationship_dynamics TO authenticated;
GRANT SELECT, INSERT ON partner_interactions TO authenticated;
GRANT SELECT ON partner_dialogue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON partner_evolution TO authenticated;

-- Grant permissions to anon users (limited read access)
GRANT SELECT ON partner_personalities TO anon;
GRANT SELECT ON personality_traits TO anon;
GRANT SELECT ON partner_dialogue TO anon;