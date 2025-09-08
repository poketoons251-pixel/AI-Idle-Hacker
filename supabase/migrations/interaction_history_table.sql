-- Interaction History Table for AI Partner Interactions
-- This table stores the history of interactions between players and AI partners

CREATE TABLE IF NOT EXISTS interaction_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    partner_id UUID REFERENCES ai_partners(id) ON DELETE CASCADE,
    interaction_type VARCHAR(50) NOT NULL, -- 'conversation', 'mission', 'cooperation', 'training'
    interaction_data JSONB NOT NULL, -- Detailed interaction content
    outcome VARCHAR(50), -- 'success', 'failure', 'neutral'
    trust_change INTEGER DEFAULT 0, -- Change in trust level (-10 to +10)
    cooperation_change INTEGER DEFAULT 0, -- Change in cooperation score
    interaction_summary TEXT, -- Brief description of what happened
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_interaction_history_player_id ON interaction_history(player_id);
CREATE INDEX idx_interaction_history_partner_id ON interaction_history(partner_id);
CREATE INDEX idx_interaction_history_created_at ON interaction_history(created_at);
CREATE INDEX idx_interaction_history_interaction_date ON interaction_history(interaction_date);
CREATE INDEX idx_interaction_history_type ON interaction_history(interaction_type);

-- Enable Row Level Security
ALTER TABLE interaction_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can only access their own interaction history
CREATE POLICY "Users can view their own interaction history" ON interaction_history
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own interaction history" ON interaction_history
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can update their own interaction history" ON interaction_history
    FOR UPDATE USING (auth.uid() = player_id);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON interaction_history TO authenticated;
GRANT SELECT ON interaction_history TO anon;

-- Insert some sample interaction history data
INSERT INTO interaction_history (player_id, partner_id, interaction_type, interaction_data, outcome, trust_change, cooperation_change, interaction_summary) VALUES
('550e8400-e29b-41d4-a716-446655440000', 
 (SELECT id FROM ai_partners WHERE partner_code = 'cipher' LIMIT 1),
 'conversation',
 '{"topic": "encryption_methods", "duration": 300, "player_responses": ["technical", "curious"]}',
 'success',
 5,
 3,
 'Discussed advanced encryption techniques with Cipher'),

('550e8400-e29b-41d4-a716-446655440000',
 (SELECT id FROM ai_partners WHERE partner_code = 'ghost' LIMIT 1),
 'mission',
 '{"mission_type": "reconnaissance", "success_rate": 0.85, "stealth_maintained": true}',
 'success',
 3,
 5,
 'Successfully completed stealth reconnaissance mission with Ghost'),

('550e8400-e29b-41d4-a716-446655440000',
 (SELECT id FROM ai_partners WHERE partner_code = 'spark' LIMIT 1),
 'cooperation',
 '{"activity": "social_engineering", "target": "corporate_security", "approach": "aggressive"}',
 'neutral',
 0,
 2,
 'Attempted social engineering approach with Spark - mixed results');