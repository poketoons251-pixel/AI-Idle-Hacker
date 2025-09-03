-- Missing Story Campaign Tables (working with existing story_choices structure)
-- Enables branching narratives and player choice tracking

-- Story Episodes: Main story containers
CREATE TABLE story_episodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    episode_number INTEGER NOT NULL,
    unlock_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Story Episode Choices: Available narrative decisions for episodes
CREATE TABLE story_episode_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    episode_id UUID REFERENCES story_episodes(id) ON DELETE CASCADE,
    choice_key VARCHAR(100) NOT NULL, -- Unique identifier for choice
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    choice_text TEXT NOT NULL, -- The actual choice option text
    prerequisites JSONB DEFAULT '{}', -- Required conditions (level, items, etc.)
    consequences JSONB DEFAULT '{}', -- Immediate effects (reputation, items, etc.)
    next_choice_key VARCHAR(100), -- Links to next choice in sequence
    is_terminal BOOLEAN DEFAULT false, -- Ends the episode
    choice_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Player Episode Choices: Track player decisions in episodes
CREATE TABLE player_episode_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    episode_id UUID REFERENCES story_episodes(id) ON DELETE CASCADE,
    choice_id UUID REFERENCES story_episode_choices(id) ON DELETE CASCADE,
    choice_key VARCHAR(100) NOT NULL,
    chosen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    choice_data JSONB DEFAULT '{}' -- Additional context data
);

-- Story Consequences: Long-term effects of choices
CREATE TABLE story_consequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    episode_id UUID REFERENCES story_episodes(id) ON DELETE CASCADE,
    consequence_type VARCHAR(50) NOT NULL, -- 'reputation', 'item', 'unlock', 'relationship'
    consequence_key VARCHAR(100) NOT NULL,
    consequence_value JSONB NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Player Episode Progress: Track current position in stories
CREATE TABLE player_episode_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    episode_id UUID REFERENCES story_episodes(id) ON DELETE CASCADE,
    current_choice_key VARCHAR(100),
    is_completed BOOLEAN DEFAULT false,
    completion_percentage INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, episode_id)
);

-- Create indexes for performance
CREATE INDEX idx_story_episodes_episode_number ON story_episodes(episode_number);
CREATE INDEX idx_story_episode_choices_episode_id ON story_episode_choices(episode_id);
CREATE INDEX idx_story_episode_choices_choice_key ON story_episode_choices(choice_key);
CREATE INDEX idx_player_episode_choices_player_id ON player_episode_choices(player_id);
CREATE INDEX idx_player_episode_choices_episode_id ON player_episode_choices(episode_id);
CREATE INDEX idx_story_consequences_player_id ON story_consequences(player_id);
CREATE INDEX idx_player_episode_progress_player_id ON player_episode_progress(player_id);

-- Enable Row Level Security
ALTER TABLE story_episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_episode_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_episode_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_consequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_episode_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Story episodes and choices are readable by all authenticated users
CREATE POLICY "Story episodes are viewable by authenticated users" ON story_episodes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Story episode choices are viewable by authenticated users" ON story_episode_choices
    FOR SELECT USING (auth.role() = 'authenticated');

-- Player-specific data policies
CREATE POLICY "Users can view their own episode choices" ON player_episode_choices
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own episode choices" ON player_episode_choices
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can view their own consequences" ON story_consequences
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own consequences" ON story_consequences
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can view their own progress" ON player_episode_progress
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage their own progress" ON player_episode_progress
    FOR ALL USING (auth.uid() = player_id);

-- Insert initial story episode data
INSERT INTO story_episodes (title, description, episode_number, unlock_level) VALUES
('The Awakening', 'Your first encounter with the underground hacking network. A mysterious contact reaches out with an offer that could change everything.', 1, 1),
('Digital Shadows', 'Dive deeper into the cybercrime underworld. Your choices here will determine your reputation and available allies.', 2, 5),
('The Corporate Conspiracy', 'Uncover a massive corporate cover-up. Your investigation skills and partner relationships will be tested.', 3, 10);

-- Insert sample story choices for Episode 1
INSERT INTO story_episode_choices (episode_id, choice_key, title, description, choice_text, consequences, next_choice_key, choice_order) 
SELECT 
    e.id,
    'ep1_start',
    'First Contact',
    'A encrypted message appears on your screen from an unknown sender claiming to have lucrative hacking contracts.',
    'Accept the mysterious contract offer',
    '{"reputation": 10, "credits": 500}',
    'ep1_accept_path',
    1
FROM story_episodes e WHERE e.episode_number = 1;

INSERT INTO story_episode_choices (episode_id, choice_key, title, description, choice_text, consequences, next_choice_key, choice_order)
SELECT 
    e.id,
    'ep1_start_alt',
    'First Contact',
    'A encrypted message appears on your screen from an unknown sender claiming to have lucrative hacking contracts.',
    'Ignore the message and continue solo operations',
    '{"reputation": -5, "security": 20}',
    'ep1_solo_path',
    2
FROM story_episodes e WHERE e.episode_number = 1;

INSERT INTO story_episode_choices (episode_id, choice_key, title, description, choice_text, consequences, next_choice_key, choice_order)
SELECT 
    e.id,
    'ep1_accept_path',
    'The Network',
    'Your contact introduces you to a network of elite hackers. They offer training and resources, but demand loyalty.',
    'Join the hacker collective',
    '{"reputation": 25, "unlock_techniques": ["advanced_social_engineering"], "partner_trust": 15}',
    'ep1_collective_member',
    1
FROM story_episodes e WHERE e.episode_number = 1;

INSERT INTO story_episode_choices (episode_id, choice_key, title, description, choice_text, consequences, next_choice_key, choice_order)
SELECT 
    e.id,
    'ep1_accept_path_alt',
    'The Network',
    'Your contact introduces you to a network of elite hackers. They offer training and resources, but demand loyalty.',
    'Maintain independence while cooperating',
    '{"reputation": 10, "credits": 1000, "partner_trust": 5}',
    'ep1_independent_contractor',
    2
FROM story_episodes e WHERE e.episode_number = 1;

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON story_episodes TO anon, authenticated;
GRANT SELECT ON story_episode_choices TO anon, authenticated;
GRANT ALL PRIVILEGES ON player_episode_choices TO authenticated;
GRANT ALL PRIVILEGES ON story_consequences TO authenticated;
GRANT ALL PRIVILEGES ON player_episode_progress TO authenticated;