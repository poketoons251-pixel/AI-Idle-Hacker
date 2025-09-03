-- Hacking Techniques Migration
-- Creates tables for Code 7 inspired hacking system

-- Create hacking_techniques table
CREATE TABLE hacking_techniques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    base_success_rate DECIMAL(3,2) NOT NULL CHECK (base_success_rate >= 0 AND base_success_rate <= 1),
    skill_requirements JSONB NOT NULL DEFAULT '{}',
    resource_cost INTEGER NOT NULL DEFAULT 0,
    execution_time INTEGER NOT NULL DEFAULT 30, -- seconds
    difficulty_level INTEGER NOT NULL DEFAULT 1 CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    unlock_level INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hacking_executions table to track player attempts
CREATE TABLE hacking_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- Will reference players table when available
    technique_id UUID REFERENCES hacking_techniques(id) ON DELETE CASCADE,
    target_name VARCHAR(200) NOT NULL,
    success BOOLEAN NOT NULL,
    execution_time INTEGER NOT NULL,
    rewards_gained JSONB DEFAULT '{}',
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial hacking techniques based on Code 7
INSERT INTO hacking_techniques (name, description, base_success_rate, skill_requirements, resource_cost, execution_time, difficulty_level, unlock_level) VALUES
(
    'Man-in-the-Middle Attack',
    'Intercept and manipulate communications between two parties by positioning yourself as a relay point. Requires network positioning and encryption knowledge.',
    0.65,
    '{"network_security": 3, "cryptography": 2}',
    25,
    45,
    3,
    5
),
(
    'Brute Force Attack',
    'Systematically attempt all possible password combinations until the correct one is found. Time-intensive but reliable against weak passwords.',
    0.75,
    '{"password_cracking": 2, "computing_power": 3}',
    15,
    60,
    2,
    1
),
(
    'Network Jamming',
    'Disrupt network communications by overwhelming the target with interference signals. Effective for creating diversions and blocking communications.',
    0.80,
    '{"signal_processing": 4, "hardware_manipulation": 3}',
    35,
    30,
    4,
    8
),
(
    'Social Engineering',
    'Manipulate human psychology to gain unauthorized access to systems or information. Relies on deception and psychological manipulation.',
    0.70,
    '{"psychology": 3, "communication": 4}',
    10,
    90,
    3,
    3
),
(
    'SQL Injection',
    'Exploit database vulnerabilities by injecting malicious SQL code through input fields. Effective against poorly secured web applications.',
    0.60,
    '{"database_knowledge": 3, "web_security": 2}',
    20,
    25,
    2,
    2
),
(
    'Zero-Day Exploit',
    'Utilize previously unknown software vulnerabilities before they are patched. Highly effective but requires advanced knowledge and rare exploits.',
    0.90,
    '{"reverse_engineering": 5, "exploit_development": 4}',
    100,
    120,
    5,
    15
);

-- Create indexes for better performance
CREATE INDEX idx_hacking_techniques_difficulty ON hacking_techniques(difficulty_level);
CREATE INDEX idx_hacking_techniques_unlock_level ON hacking_techniques(unlock_level);
CREATE INDEX idx_hacking_executions_player ON hacking_executions(player_id);
CREATE INDEX idx_hacking_executions_technique ON hacking_executions(technique_id);
CREATE INDEX idx_hacking_executions_date ON hacking_executions(executed_at);

-- Enable Row Level Security
ALTER TABLE hacking_techniques ENABLE ROW LEVEL SECURITY;
ALTER TABLE hacking_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for hacking_techniques (public read access)
CREATE POLICY "Allow public read access to hacking techniques" ON hacking_techniques
    FOR SELECT USING (true);

-- Create policies for hacking_executions (users can only see their own executions)
CREATE POLICY "Users can view their own hacking executions" ON hacking_executions
    FOR SELECT USING (auth.uid()::text = player_id::text);

CREATE POLICY "Users can insert their own hacking executions" ON hacking_executions
    FOR INSERT WITH CHECK (auth.uid()::text = player_id::text);

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON hacking_techniques TO anon;
GRANT SELECT ON hacking_techniques TO authenticated;
GRANT ALL PRIVILEGES ON hacking_executions TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hacking_techniques_updated_at
    BEFORE UPDATE ON hacking_techniques
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE hacking_techniques IS 'Available hacking techniques inspired by Code 7 with realistic parameters';
COMMENT ON TABLE hacking_executions IS 'Log of hacking attempts by players with results and rewards';
COMMENT ON COLUMN hacking_techniques.base_success_rate IS 'Base success rate (0.0 to 1.0) before skill and equipment modifiers';
COMMENT ON COLUMN hacking_techniques.skill_requirements IS 'JSON object defining required skill levels for optimal use';
COMMENT ON COLUMN hacking_techniques.execution_time IS 'Base execution time in seconds';
COMMENT ON COLUMN hacking_techniques.difficulty_level IS 'Difficulty rating from 1 (easy) to 5 (expert)';
COMMENT ON COLUMN hacking_techniques.unlock_level IS 'Player level required to unlock this technique';