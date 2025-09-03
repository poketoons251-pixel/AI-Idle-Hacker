-- Investigation and Intelligence Gathering Database Schema
-- Enables document analysis and target intelligence mechanics

-- Intelligence Documents: Available information sources
CREATE TABLE intelligence_docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doc_type VARCHAR(50) NOT NULL, -- 'target_profile', 'security_report', 'network_map', 'employee_data'
    target_id VARCHAR(100) NOT NULL, -- Target system/organization identifier
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content JSONB NOT NULL, -- Document data structure
    classification_level INTEGER DEFAULT 1, -- 1=public, 2=restricted, 3=classified, 4=top_secret
    unlock_requirements JSONB DEFAULT '{}', -- Level, skills, or items needed
    intelligence_value INTEGER DEFAULT 10, -- Points gained when analyzed
    discovery_chance DECIMAL(3,2) DEFAULT 0.50, -- Base chance to find during investigation
    is_discovered BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investigation Reports: Player analysis results
CREATE TABLE investigation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    doc_id UUID REFERENCES intelligence_docs(id) ON DELETE CASCADE,
    target_id VARCHAR(100) NOT NULL,
    analysis_type VARCHAR(50) NOT NULL, -- 'surface_scan', 'deep_analysis', 'pattern_recognition'
    findings JSONB NOT NULL, -- Discovered information
    intelligence_gained INTEGER DEFAULT 0,
    analysis_quality DECIMAL(3,2) DEFAULT 0.0, -- 0.0 to 1.0 quality score
    time_invested INTEGER DEFAULT 0, -- Minutes spent analyzing
    tools_used JSONB DEFAULT '[]', -- Hacking tools utilized
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Target Profiles: Comprehensive target information
CREATE TABLE target_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'corporation', 'government', 'individual', 'criminal_org'
    difficulty_level INTEGER DEFAULT 1,
    security_rating INTEGER DEFAULT 50, -- 1-100 security strength
    known_vulnerabilities JSONB DEFAULT '[]',
    network_topology JSONB DEFAULT '{}',
    employee_count INTEGER DEFAULT 0,
    estimated_value INTEGER DEFAULT 1000, -- Potential credits from successful hack
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Player Intelligence: Track player's knowledge about targets
CREATE TABLE player_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    target_id VARCHAR(100) NOT NULL,
    intelligence_level INTEGER DEFAULT 0, -- Total intelligence points for this target
    known_vulnerabilities JSONB DEFAULT '[]',
    discovered_docs INTEGER DEFAULT 0,
    analysis_count INTEGER DEFAULT 0,
    last_investigation TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, target_id)
);

-- Investigation Sessions: Track ongoing investigations
CREATE TABLE investigation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL, -- References auth.users
    target_id VARCHAR(100) NOT NULL,
    session_type VARCHAR(50) NOT NULL, -- 'reconnaissance', 'social_engineering', 'technical_analysis'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'failed', 'abandoned'
    progress_percentage INTEGER DEFAULT 0,
    time_remaining INTEGER DEFAULT 0, -- Minutes left for completion
    resources_used JSONB DEFAULT '{}', -- Tools, credits, etc. consumed
    potential_rewards JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Intelligence Marketplace: Trade information with other players/NPCs
CREATE TABLE intelligence_marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID, -- References auth.users (NULL for NPC sellers)
    seller_name VARCHAR(100) NOT NULL,
    doc_id UUID REFERENCES intelligence_docs(id) ON DELETE CASCADE,
    target_id VARCHAR(100) NOT NULL,
    price INTEGER NOT NULL,
    currency_type VARCHAR(20) DEFAULT 'credits', -- 'credits', 'reputation', 'favor_tokens'
    listing_type VARCHAR(20) DEFAULT 'sale', -- 'sale', 'trade', 'auction'
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_intelligence_docs_target_id ON intelligence_docs(target_id);
CREATE INDEX idx_intelligence_docs_doc_type ON intelligence_docs(doc_type);
CREATE INDEX idx_investigation_reports_player_id ON investigation_reports(player_id);
CREATE INDEX idx_investigation_reports_target_id ON investigation_reports(target_id);
CREATE INDEX idx_target_profiles_target_id ON target_profiles(target_id);
CREATE INDEX idx_player_intelligence_player_id ON player_intelligence(player_id);
CREATE INDEX idx_investigation_sessions_player_id ON investigation_sessions(player_id);
CREATE INDEX idx_investigation_sessions_status ON investigation_sessions(status);
CREATE INDEX idx_intelligence_marketplace_target_id ON intelligence_marketplace(target_id);

-- Enable Row Level Security
ALTER TABLE intelligence_docs ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_marketplace ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Intelligence docs are viewable by authenticated users (discovery mechanics handle access)
CREATE POLICY "Intelligence docs are viewable by authenticated users" ON intelligence_docs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Target profiles are viewable by all authenticated users
CREATE POLICY "Target profiles are viewable by authenticated users" ON target_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- Player-specific data policies
CREATE POLICY "Users can view their own investigation reports" ON investigation_reports
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their own investigation reports" ON investigation_reports
    FOR INSERT WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Users can view their own intelligence" ON player_intelligence
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage their own intelligence" ON player_intelligence
    FOR ALL USING (auth.uid() = player_id);

CREATE POLICY "Users can view their own investigation sessions" ON investigation_sessions
    FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can manage their own investigation sessions" ON investigation_sessions
    FOR ALL USING (auth.uid() = player_id);

-- Marketplace policies
CREATE POLICY "Marketplace listings are viewable by authenticated users" ON intelligence_marketplace
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can create marketplace listings" ON intelligence_marketplace
    FOR INSERT WITH CHECK (auth.uid() = seller_id OR seller_id IS NULL);

-- Insert sample target profiles
INSERT INTO target_profiles (target_id, name, target_type, difficulty_level, security_rating, estimated_value) VALUES
('megacorp_alpha', 'MegaCorp Alpha Industries', 'corporation', 3, 75, 50000),
('shadow_bank', 'Shadow Financial Network', 'corporation', 5, 90, 100000),
('data_broker_zeta', 'Zeta Data Brokerage', 'corporation', 2, 60, 25000),
('underground_market', 'Digital Underground Marketplace', 'criminal_org', 4, 70, 75000),
('govt_surveillance', 'Government Surveillance Division', 'government', 6, 95, 150000);

-- Insert sample intelligence documents
INSERT INTO intelligence_docs (doc_type, target_id, title, description, content, classification_level, intelligence_value) VALUES
('target_profile', 'megacorp_alpha', 'MegaCorp Employee Directory', 'Leaked employee contact information and organizational structure', '{"employees": 15000, "departments": ["IT", "Finance", "R&D", "Security"], "key_personnel": ["John Smith - CISO", "Jane Doe - IT Director"]}', 2, 25),
('security_report', 'megacorp_alpha', 'Q3 Security Assessment', 'Internal security audit revealing vulnerabilities', '{"vulnerabilities": ["outdated_firewall", "weak_passwords", "unpatched_systems"], "risk_level": "medium"}', 3, 40),
('network_map', 'shadow_bank', 'Network Infrastructure Diagram', 'Detailed network topology and server locations', '{"servers": 50, "firewalls": 8, "entry_points": ["VPN", "Web Portal", "Email Gateway"], "backup_systems": true}', 4, 60),
('employee_data', 'data_broker_zeta', 'Social Engineering Profiles', 'Psychological profiles of key employees for social engineering', '{"targets": [{"name": "Alex Chen", "role": "System Admin", "weaknesses": ["gambling", "social_media_oversharing"]}]}', 3, 35);

-- Insert sample marketplace listings
INSERT INTO intelligence_marketplace (seller_name, doc_id, target_id, price, description) 
SELECT 
    'Anonymous Broker',
    id,
    target_id,
    intelligence_value * 10,
    'High-quality intelligence document - verified authentic'
FROM intelligence_docs 
WHERE classification_level <= 2;