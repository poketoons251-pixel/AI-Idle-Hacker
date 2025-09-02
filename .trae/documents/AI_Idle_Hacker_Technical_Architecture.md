# AI Idle Hacker - Technical Architecture Document

## 1. Architecture Design

```mermaid
graph TD
  A[User Browser] --> B[React Frontend Application]
  B --> C[Supabase SDK]
  C --> D[Supabase Service]
  B --> E[Local Storage]
  B --> F[Web Workers]
  
  subgraph "Frontend Layer"
    B
    E
    F
  end
  
  subgraph "Service Layer (Provided by Supabase)"
    D
  end
```

## 2. Technology Description

* Frontend: React\@18 + TypeScript + Tailwind CSS\@3 + Vite + Zustand (state management)

* Backend: Supabase (Authentication, Database, Real-time subscriptions)

* Additional: Web Workers for idle calculations, Local Storage for offline progress

## 3. Route Definitions

| Route         | Purpose                                                                   |
| ------------- | ------------------------------------------------------------------------- |
| /             | Main Dashboard - displays resources, active operations, and quick actions |
| /character    | Character Progression - skill trees, AI companions, equipment management  |
| /operations   | Hacking Operations - target browser, mission planner, attack simulator    |
| /ai-autoplay  | AI Autoplay - strategy configuration, performance analytics, override controls |
| /marketplace  | Marketplace - equipment shop, AI modules, premium store                   |
| /leaderboards | Leaderboards - global rankings, achievements, social features             |
| /quests       | Quest System - story campaigns, daily challenges, achievement tracking    |
| /settings     | Settings - game configuration, account management, tutorials              |
| /login        | Authentication - login/register with email or OAuth                       |

## 4. API Definitions

### 4.1 Core API

**Player Progress Management**

```
GET /api/player/profile
```

Response:

| Param Name   | Param Type | Description                                   |
| ------------ | ---------- | --------------------------------------------- |
| id           | string     | Player unique identifier                      |
| username     | string     | Player display name                           |
| level        | number     | Current player level                          |
| credits      | number     | Available in-game currency                    |
| reputation   | number     | Player reputation points                      |
| last\_active | timestamp  | Last activity timestamp for idle calculations |

**Hacking Operations**

```
POST /api/operations/start
```

Request:

| Param Name | Param Type | isRequired | Description                    |
| ---------- | ---------- | ---------- | ------------------------------ |
| target\_id | string     | true       | Target system identifier       |
| strategy   | object     | true       | Hacking strategy configuration |
| duration   | number     | true       | Operation duration in minutes  |

Response:

| Param Name            | Param Type | Description                   |
| --------------------- | ---------- | ----------------------------- |
| operation\_id         | string     | Unique operation identifier   |
| estimated\_completion | timestamp  | Expected completion time      |
| success\_probability  | number     | Calculated success rate (0-1) |

**Equipment and Upgrades**

```
POST /api/equipment/upgrade
```

Request:

| Param Name     | Param Type | isRequired | Description               |
| -------------- | ---------- | ---------- | ------------------------- |
| equipment\_id  | string     | true       | Equipment item identifier |
| upgrade\_level | number     | true       | Target upgrade level      |

Response:

| Param Name | Param Type | Description                  |
| ---------- | ---------- | ---------------------------- |
| success    | boolean    | Upgrade success status       |
| new\_stats | object     | Updated equipment statistics |
| cost       | number     | Credits spent on upgrade     |

**Quest System Management**

```
GET /api/quests/available
```

Response:

| Param Name | Param Type | Description |
|------------|------------|-------------|
| quests | array | Available quests for the player |
| story_progress | object | Current story campaign progress |
| daily_quests | array | Available daily challenges |
| weekly_quests | array | Available weekly challenges |

```
POST /api/quests/start
```

Request:

| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| quest_id | string | true | Quest identifier to start |
| choices | object | false | Player choices for branching quests |

Response:

| Param Name | Param Type | Description |
|------------|------------|-------------|
| success | boolean | Quest start status |
| active_objectives | array | Current quest objectives |
| story_context | object | Narrative context and lore |

```
POST /api/quests/complete
```

Request:

| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| quest_id | string | true | Quest identifier to complete |
| completion_data | object | true | Quest completion evidence/data |
| player_choices | object | false | Final player decisions |

Response:

| Param Name | Param Type | Description |
|------------|------------|-------------|
| success | boolean | Quest completion status |
| rewards | object | Earned rewards (credits, items, abilities) |
| story_impact | object | Narrative consequences of choices |
| unlocked_content | array | New quests or areas unlocked |

**AI Autoplay Management**

```
GET /api/ai/config
```

Response:

| Param Name | Param Type | Description |
|------------|------------|-------------|
| enabled | boolean | AI autoplay activation status |
| priorities | object | AI decision-making priorities configuration |
| risk_tolerance | number | Risk level preference (0-1) |
| resource_allocation | object | Automatic resource management settings |

```
POST /api/ai/configure
```

Request:

| Param Name | Param Type | isRequired | Description |
|------------|------------|------------|-------------|
| priorities | object | true | AI behavior priorities (operations, upgrades, skills) |
| risk_tolerance | number | true | Risk preference level (0-1) |
| auto_upgrade | boolean | false | Enable automatic equipment upgrades |
| energy_management | object | false | Energy allocation strategy |

Response:

| Param Name | Param Type | Description |
|------------|------------|-------------|
| success | boolean | Configuration update status |
| active_since | timestamp | AI activation timestamp |

```
GET /api/ai/analytics
```

Response:

| Param Name | Param Type | Description |
|------------|------------|-------------|
| decisions_made | number | Total AI decisions count |
| success_rate | number | AI operation success rate |
| credits_earned | number | Credits generated by AI |
| efficiency_score | number | Overall AI performance rating |
| recent_actions | array | Last 10 AI actions with timestamps |

## 5. Data Model

### 5.1 Data Model Definition

```mermaid
erDiagram
  PLAYERS ||--o{ OPERATIONS : performs
  PLAYERS ||--o{ EQUIPMENT : owns
  PLAYERS ||--o{ AI_COMPANIONS : has
  PLAYERS ||--o{ ACHIEVEMENTS : unlocks
  PLAYERS ||--o{ QUESTS : participates
  PLAYERS ||--o{ QUEST_PROGRESS : tracks
  PLAYERS ||--o{ STORY_CHOICES : makes
  PLAYERS ||--|| AI_CONFIGS : configures
  PLAYERS ||--o{ AI_ANALYTICS : generates
  OPERATIONS ||--|| TARGETS : targets
  EQUIPMENT ||--|| EQUIPMENT_TYPES : belongs_to
  QUESTS ||--o{ QUEST_OBJECTIVES : contains
  QUESTS ||--o{ QUEST_REWARDS : offers
  QUESTS ||--o{ QUEST_PREREQUISITES : requires
  
  PLAYERS {
    uuid id PK
    string username
    string email
    integer level
    bigint credits
    integer reputation
    jsonb skills
    timestamp last_active
    timestamp created_at
  }
  
  OPERATIONS {
    uuid id PK
    uuid player_id FK
    uuid target_id FK
    jsonb strategy
    integer duration_minutes
    timestamp started_at
    timestamp completed_at
    boolean success
    bigint rewards_earned
  }
  
  TARGETS {
    uuid id PK
    string name
    integer difficulty_level
    bigint base_reward
    jsonb requirements
    boolean active
  }
  
  EQUIPMENT {
    uuid id PK
    uuid player_id FK
    uuid equipment_type_id FK
    integer level
    jsonb stats
    boolean equipped
    timestamp acquired_at
  }
  
  EQUIPMENT_TYPES {
    uuid id PK
    string name
    string category
    jsonb base_stats
    jsonb upgrade_costs
  }
  
  AI_COMPANIONS {
    uuid id PK
    uuid player_id FK
    string name
    string personality_type
    integer level
    jsonb abilities
    boolean active
  }
  
  ACHIEVEMENTS {
    uuid id PK
    uuid player_id FK
    string achievement_type
    jsonb progress
    timestamp unlocked_at
  }
  
  AI_CONFIGS {
    uuid id PK
    uuid player_id FK
    boolean enabled
    jsonb priorities
    decimal risk_tolerance
    jsonb resource_allocation
    boolean auto_upgrade
    jsonb energy_management
    timestamp created_at
    timestamp updated_at
  }
  
  AI_ANALYTICS {
    uuid id PK
    uuid player_id FK
    integer decisions_made
    decimal success_rate
    bigint credits_earned
    decimal efficiency_score
    jsonb recent_actions
    timestamp recorded_at
  }
  
  QUESTS {
    uuid id PK
    string title
    text description
    string quest_type
    integer difficulty_level
    jsonb story_context
    jsonb branching_paths
    boolean repeatable
    timestamp available_from
    timestamp available_until
    boolean active
  }
  
  QUEST_OBJECTIVES {
    uuid id PK
    uuid quest_id FK
    string objective_type
    text description
    jsonb target_criteria
    jsonb completion_data
    boolean optional
    integer order_index
  }
  
  QUEST_PROGRESS {
    uuid id PK
    uuid player_id FK
    uuid quest_id FK
    string status
    jsonb objective_progress
    jsonb player_choices
    timestamp started_at
    timestamp completed_at
  }
  
  QUEST_REWARDS {
    uuid id PK
    uuid quest_id FK
    string reward_type
    jsonb reward_data
    boolean conditional
    jsonb conditions
  }
  
  QUEST_PREREQUISITES {
    uuid id PK
    uuid quest_id FK
    string prerequisite_type
    jsonb prerequisite_data
    boolean required
  }
  
  STORY_CHOICES {
    uuid id PK
    uuid player_id FK
    uuid quest_id FK
    string choice_point
    jsonb selected_option
    jsonb consequences
    timestamp made_at
  }
```

### 5.2 Data Definition Language

**Players Table**

```sql
-- Create players table
CREATE TABLE players (
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

-- Create indexes
CREATE INDEX idx_players_email ON players(email);
CREATE INDEX idx_players_last_active ON players(last_active);
CREATE INDEX idx_players_reputation ON players(reputation DESC);

-- Grant permissions
GRANT SELECT ON players TO anon;
GRANT ALL PRIVILEGES ON players TO authenticated;
```

**Operations Table**

```sql
-- Create operations table
CREATE TABLE operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    target_id UUID NOT NULL,
    strategy JSONB NOT NULL,
    duration_minutes INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    success BOOLEAN,
    rewards_earned BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_operations_player_id ON operations(player_id);
CREATE INDEX idx_operations_completed_at ON operations(completed_at);
CREATE INDEX idx_operations_active ON operations(completed_at) WHERE completed_at IS NULL;

-- Grant permissions
GRANT SELECT ON operations TO anon;
GRANT ALL PRIVILEGES ON operations TO authenticated;
```

**Targets Table**

```sql
-- Create targets table
CREATE TABLE targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    difficulty_level INTEGER NOT NULL,
    base_reward BIGINT NOT NULL,
    requirements JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_targets_difficulty ON targets(difficulty_level);
CREATE INDEX idx_targets_active ON targets(active) WHERE active = true;

-- Grant permissions
GRANT SELECT ON targets TO anon;
GRANT ALL PRIVILEGES ON targets TO authenticated;

-- Insert initial targets
INSERT INTO targets (name, difficulty_level, base_reward, requirements) VALUES
('Local Network Router', 1, 100, '{"min_level": 1}'),
('Small Business Server', 2, 250, '{"min_level": 3}'),
('Corporate Database', 5, 1000, '{"min_level": 10}'),
('Government Firewall', 10, 5000, '{"min_level": 25}');
```

**Equipment Tables**

```sql
-- Create equipment types table
CREATE TABLE equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    base_stats JSONB NOT NULL,
    upgrade_costs JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create equipment table
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    equipment_type_id UUID NOT NULL,
    level INTEGER DEFAULT 1,
    stats JSONB NOT NULL,
    equipped BOOLEAN DEFAULT false,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_equipment_player_id ON equipment(player_id);
CREATE INDEX idx_equipment_equipped ON equipment(equipped) WHERE equipped = true;

-- Grant permissions
GRANT SELECT ON equipment_types TO anon;
GRANT ALL PRIVILEGES ON equipment_types TO authenticated;
GRANT SELECT ON equipment TO anon;
GRANT ALL PRIVILEGES ON equipment TO authenticated;
```

**AI Companions Table**

```sql
-- Create AI companions table
CREATE TABLE ai_companions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    personality_type VARCHAR(50) NOT NULL,
    level INTEGER DEFAULT 1,
    abilities JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_companions_player_id ON ai_companions(player_id);
CREATE INDEX idx_ai_companions_active ON ai_companions(active) WHERE active = true;

-- Grant permissions
GRANT SELECT ON ai_companions TO anon;
GRANT ALL PRIVILEGES ON ai_companions TO authenticated;
```

**Achievements Table**

```sql
-- Create achievements table
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    achievement_type VARCHAR(100) NOT NULL,
    progress JSONB DEFAULT '{}',
    unlocked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_achievements_player_id ON achievements(player_id);
CREATE INDEX idx_achievements_unlocked ON achievements(unlocked_at) WHERE unlocked_at IS NOT NULL;

-- Grant permissions
GRANT SELECT ON achievements TO anon;
GRANT ALL PRIVILEGES ON achievements TO authenticated;
```

**AI Configuration Table**

```sql
-- Create AI configuration table
CREATE TABLE ai_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT false,
    priorities JSONB DEFAULT '{"operations": 0.6, "upgrades": 0.3, "skills": 0.1}',
    risk_tolerance DECIMAL(3,2) DEFAULT 0.5 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
    resource_allocation JSONB DEFAULT '{"energy_reserve": 0.2, "auto_spend_threshold": 0.8}',
    auto_upgrade BOOLEAN DEFAULT true,
    energy_management JSONB DEFAULT '{"priority_operations": true, "idle_threshold": 0.9}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_configs_player_id ON ai_configs(player_id);
CREATE INDEX idx_ai_configs_enabled ON ai_configs(enabled) WHERE enabled = true;

-- Grant permissions
GRANT SELECT ON ai_configs TO anon;
GRANT ALL PRIVILEGES ON ai_configs TO authenticated;
```

**AI Analytics Table**

```sql
-- Create AI analytics table
CREATE TABLE ai_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL,
    decisions_made INTEGER DEFAULT 0,
    success_rate DECIMAL(5,4) DEFAULT 0.0000,
    credits_earned BIGINT DEFAULT 0,
    efficiency_score DECIMAL(5,4) DEFAULT 0.0000,
    recent_actions JSONB DEFAULT '[]',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_analytics_player_id ON ai_analytics(player_id);
CREATE INDEX idx_ai_analytics_recorded_at ON ai_analytics(recorded_at DESC);
CREATE INDEX idx_ai_analytics_efficiency ON ai_analytics(efficiency_score DESC);

-- Grant permissions
GRANT SELECT ON ai_analytics TO anon;
GRANT ALL PRIVILEGES ON ai_analytics TO authenticated;
```

**Quest System Tables**

```sql
-- Create quests table
CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    quest_type VARCHAR(50) NOT NULL CHECK (quest_type IN ('story', 'daily', 'weekly', 'achievement', 'special_event')),
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level >= 1 AND difficulty_level <= 10),
    story_context JSONB DEFAULT '{}',
    branching_paths JSONB DEFAULT '{}',
    repeatable BOOLEAN DEFAULT false,
    available_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    available_until TIMESTAMP WITH TIME ZONE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest objectives table
CREATE TABLE quest_objectives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    objective_type VARCHAR(50) NOT NULL CHECK (objective_type IN ('hack_target', 'collect_data', 'infiltrate_network', 'social_engineer', 'upgrade_equipment', 'reach_level')),
    description TEXT NOT NULL,
    target_criteria JSONB NOT NULL,
    completion_data JSONB DEFAULT '{}',
    optional BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest progress table
CREATE TABLE quest_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'active', 'completed', 'failed', 'abandoned')),
    objective_progress JSONB DEFAULT '{}',
    player_choices JSONB DEFAULT '{}',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(player_id, quest_id)
);

-- Create quest rewards table
CREATE TABLE quest_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('credits', 'experience', 'equipment', 'ability', 'story_unlock', 'achievement')),
    reward_data JSONB NOT NULL,
    conditional BOOLEAN DEFAULT false,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quest prerequisites table
CREATE TABLE quest_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    prerequisite_type VARCHAR(50) NOT NULL CHECK (prerequisite_type IN ('level', 'quest_completed', 'equipment_owned', 'skill_level', 'story_choice')),
    prerequisite_data JSONB NOT NULL,
    required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create story choices table
CREATE TABLE story_choices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    quest_id UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    choice_point VARCHAR(100) NOT NULL,
    selected_option JSONB NOT NULL,
    consequences JSONB DEFAULT '{}',
    made_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for quest system
CREATE INDEX idx_quests_type ON quests(quest_type);
CREATE INDEX idx_quests_difficulty ON quests(difficulty_level);
CREATE INDEX idx_quests_active ON quests(active) WHERE active = true;
CREATE INDEX idx_quest_objectives_quest_id ON quest_objectives(quest_id);
CREATE INDEX idx_quest_objectives_type ON quest_objectives(objective_type);
CREATE INDEX idx_quest_progress_player_id ON quest_progress(player_id);
CREATE INDEX idx_quest_progress_status ON quest_progress(status);
CREATE INDEX idx_quest_rewards_quest_id ON quest_rewards(quest_id);
CREATE INDEX idx_quest_prerequisites_quest_id ON quest_prerequisites(quest_id);
CREATE INDEX idx_story_choices_player_id ON story_choices(player_id);
CREATE INDEX idx_story_choices_quest_id ON story_choices(quest_id);

-- Grant permissions for quest system
GRANT SELECT ON quests TO anon;
GRANT ALL PRIVILEGES ON quests TO authenticated;
GRANT SELECT ON quest_objectives TO anon;
GRANT ALL PRIVILEGES ON quest_objectives TO authenticated;
GRANT SELECT ON quest_progress TO anon;
GRANT ALL PRIVILEGES ON quest_progress TO authenticated;
GRANT SELECT ON quest_rewards TO anon;
GRANT ALL PRIVILEGES ON quest_rewards TO authenticated;
GRANT SELECT ON quest_prerequisites TO anon;
GRANT ALL PRIVILEGES ON quest_prerequisites TO authenticated;
GRANT SELECT ON story_choices TO anon;
GRANT ALL PRIVILEGES ON story_choices TO authenticated;

-- Insert initial story campaign quests
INSERT INTO quests (title, description, quest_type, difficulty_level, story_context, branching_paths) VALUES
('The First Breach', 'Your journey into the digital underworld begins. A mysterious contact has offered you your first real hacking job - infiltrate a small corporate network to prove your worth.', 'story', 1, '{"chapter": 1, "theme": "initiation", "characters": ["mysterious_contact"], "location": "underground_forum"}', '{"approach": ["stealth", "aggressive", "social"]}'),
('Digital Shadows', 'The corporate data you stole reveals a conspiracy. Choose your path: expose the truth to the media, sell the information to competitors, or use it as leverage against the corporation.', 'story', 2, '{"chapter": 2, "theme": "moral_choice", "characters": ["journalist", "corporate_rival", "ceo"], "location": "secure_meeting"}', '{"resolution": ["whistleblower", "profiteer", "blackmailer"]}'),
('The Network War', 'Your previous choices have consequences. Rival hacker groups are now aware of your existence. Navigate the complex web of digital politics and choose your allies wisely.', 'story', 3, '{"chapter": 3, "theme": "faction_choice", "characters": ["ghost_collective", "data_liberation_front", "cyber_mercenaries"], "location": "dark_web_summit"}', '{"alliance": ["idealists", "anarchists", "mercenaries"]}');

-- Insert quest objectives for the first story quest
INSERT INTO quest_objectives (quest_id, objective_type, description, target_criteria, order_index) 
SELECT id, 'hack_target', 'Infiltrate the corporate network without triggering security alerts', '{"target_type": "corporate_server", "stealth_required": true, "max_detection_level": 2}', 1
FROM quests WHERE title = 'The First Breach';

INSERT INTO quest_objectives (quest_id, objective_type, description, target_criteria, order_index)
SELECT id, 'collect_data', 'Extract sensitive financial records from the database', '{"data_type": "financial_records", "minimum_files": 5, "encryption_level": "basic"}', 2
FROM quests WHERE title = 'The First Breach';

-- Insert quest rewards
INSERT INTO quest_rewards (quest_id, reward_type, reward_data)
SELECT id, 'credits', '{"amount": 500}'
FROM quests WHERE title = 'The First Breach';

INSERT INTO quest_rewards (quest_id, reward_type, reward_data)
SELECT id, 'experience', '{"amount": 100}'
FROM quests WHERE title = 'The First Breach';

INSERT INTO quest_rewards (quest_id, reward_type, reward_data)
SELECT id, 'story_unlock', '{"next_chapter": 2, "unlocked_contacts": ["mysterious_contact"]}'
FROM quests WHERE title = 'The First Breach';
```

