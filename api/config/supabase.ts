import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
}

// Create Supabase client with service role key for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client with anon key for client-side operations
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Database helper functions
export const db = {
  // Story episodes
  async getStoryEpisodes(playerId?: string) {
    const { data, error } = await supabase
      .from('story_episodes')
      .select('*')
      .order('episode_number');
    
    if (error) throw error;
    return data;
  },

  async getStoryChoices(episodeId: string) {
    const { data, error } = await supabase
      .from('story_episode_choices')
      .select('*')
      .eq('episode_id', episodeId)
      .order('choice_order');
    
    if (error) throw error;
    return data;
  },

  async savePlayerChoice(playerId: string, episodeId: string, choiceId: string) {
    const { data, error } = await supabase
      .from('player_episode_choices')
      .insert({
        player_id: playerId,
        episode_id: episodeId,
        choice_id: choiceId,
        made_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getPlayerProgress(playerId: string) {
    const { data, error } = await supabase
      .from('player_episode_progress')
      .select('*')
      .eq('player_id', playerId);
    
    if (error) throw error;
    return data;
  },

  // Intelligence documents
  async getIntelligenceDocs(playerId?: string) {
    const { data, error } = await supabase
      .from('intelligence_docs')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async getInvestigationReports(playerId: string) {
    const { data, error } = await supabase
      .from('investigation_reports')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Partner relationships
  async getPartnerRelationships(playerId: string) {
    const { data, error } = await supabase
      .from('partner_relationships')
      .select(`
        *,
        ai_partners (*)
      `)
      .eq('player_id', playerId);
    
    if (error) throw error;
    return data;
  },

  async getAIPartners() {
    const { data, error } = await supabase
      .from('ai_partners')
      .select('*')
      .eq('is_available', true)
      .order('name');
    
    if (error) throw error;
    return data;
  }
};

export default supabase;