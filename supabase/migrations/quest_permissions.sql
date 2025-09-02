-- Grant permissions for quest system tables to anon and authenticated roles

-- Grant permissions for quest_categories table
GRANT SELECT ON quest_categories TO anon;
GRANT ALL PRIVILEGES ON quest_categories TO authenticated;

-- Grant permissions for quests table
GRANT SELECT ON quests TO anon;
GRANT ALL PRIVILEGES ON quests TO authenticated;

-- Grant permissions for quest_objectives table
GRANT SELECT ON quest_objectives TO anon;
GRANT ALL PRIVILEGES ON quest_objectives TO authenticated;

-- Grant permissions for quest_progress table (RLS enabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON quest_progress TO anon;
GRANT ALL PRIVILEGES ON quest_progress TO authenticated;

-- Grant permissions for quest_rewards table
GRANT SELECT ON quest_rewards TO anon;
GRANT ALL PRIVILEGES ON quest_rewards TO authenticated;

-- Grant permissions for quest_prerequisites table
GRANT SELECT ON quest_prerequisites TO anon;
GRANT ALL PRIVILEGES ON quest_prerequisites TO authenticated;

-- Grant permissions for story_choices table (RLS enabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON story_choices TO anon;
GRANT ALL PRIVILEGES ON story_choices TO authenticated;

-- Grant permissions for player_reputation table (RLS enabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON player_reputation TO anon;
GRANT ALL PRIVILEGES ON player_reputation TO authenticated;

-- Grant permissions for quest_achievements table (RLS enabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON quest_achievements TO anon;
GRANT ALL PRIVILEGES ON quest_achievements TO authenticated;

-- Grant permissions for quest_analytics table
GRANT SELECT, INSERT ON quest_analytics TO anon;
GRANT ALL PRIVILEGES ON quest_analytics TO authenticated;

-- Grant permissions for players table (RLS enabled)
GRANT SELECT, INSERT, UPDATE, DELETE ON players TO anon;
GRANT ALL PRIVILEGES ON players TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on quest functions
GRANT EXECUTE ON FUNCTION get_available_quests(uuid) TO anon;
GRANT EXECUTE ON FUNCTION get_available_quests(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION start_quest(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION start_quest(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_quest(uuid, uuid, jsonb, character varying) TO anon;
GRANT EXECUTE ON FUNCTION complete_quest(uuid, uuid, jsonb, character varying) TO authenticated;

-- Verify permissions (this will show current permissions)
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN (
    'players', 'quest_categories', 'quests', 'quest_objectives', 
    'quest_progress', 'quest_rewards', 'quest_prerequisites', 
    'story_choices', 'player_reputation', 'quest_achievements', 'quest_analytics'
)
ORDER BY table_name, grantee;