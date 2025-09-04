import { createClient } from '@supabase/supabase-js';

// Supabase configuration for frontend
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fudyahypzgleezrtdnai.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1ZHlhaHlwemdsZWV6cnRkbmFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTM0ODgsImV4cCI6MjA3MjI2OTQ4OH0.XOThtbknHcoE9oQKVj4mlO2-AKQVAjlEAo5l428dymI';

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client for frontend use
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Story episodes functions
export const storyService = {
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
  }
};