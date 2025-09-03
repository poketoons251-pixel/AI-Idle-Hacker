import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Get current available story choices for a player
router.get('/current-choices', async (req, res) => {
  try {
    const { player_id, episode_id } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Get player's current progress in episodes
    const { data: progress, error: progressError } = await supabase
      .from('player_episode_progress')
      .select('*')
      .eq('player_id', player_id)
      .eq('is_completed', false)
      .order('started_at', { ascending: true });

    if (progressError) {
      return res.status(500).json({ error: progressError.message });
    }

    // If no active episodes, get available episodes to start
    if (!progress || progress.length === 0) {
      const { data: episodes, error: episodeError } = await supabase
        .from('story_episodes')
        .select('*')
        .eq('is_active', true)
        .order('episode_number', { ascending: true })
        .limit(1);

      if (episodeError) {
        return res.status(500).json({ error: episodeError.message });
      }

      if (episodes && episodes.length > 0) {
        // Start first episode
        const episode = episodes[0];
        const { data: choices, error: choicesError } = await supabase
          .from('story_choices')
          .select('*')
          .eq('episode_id', episode.id)
          .eq('choice_key', 'ep1_start')
          .order('choice_order', { ascending: true });

        if (choicesError) {
          return res.status(500).json({ error: choicesError.message });
        }

        return res.json({
          episode: episode,
          current_choice_key: 'ep1_start',
          available_choices: choices || [],
          progress_percentage: 0
        });
      }
    }

    // Get current choices for active episode
    const currentProgress = episode_id 
      ? progress.find(p => p.episode_id === episode_id)
      : progress[0];

    if (!currentProgress) {
      return res.status(404).json({ error: 'No active story progress found' });
    }

    // Get episode details
    const { data: episode, error: episodeError } = await supabase
      .from('story_episodes')
      .select('*')
      .eq('id', currentProgress.episode_id)
      .single();

    if (episodeError) {
      return res.status(500).json({ error: episodeError.message });
    }

    // Get available choices for current position
    const choiceKey = currentProgress.current_choice_key || 'ep1_start';
    const { data: choices, error: choicesError } = await supabase
      .from('story_choices')
      .select('*')
      .eq('episode_id', currentProgress.episode_id)
      .eq('choice_key', choiceKey)
      .order('choice_order', { ascending: true });

    if (choicesError) {
      return res.status(500).json({ error: choicesError.message });
    }

    res.json({
      episode: episode,
      current_choice_key: choiceKey,
      available_choices: choices || [],
      progress_percentage: currentProgress.completion_percentage
    });

  } catch (error) {
    console.error('Error fetching current choices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make a story choice
router.post('/make-choice', async (req, res) => {
  try {
    const { player_id, episode_id, choice_id, choice_key } = req.body;

    if (!player_id || !episode_id || !choice_id) {
      return res.status(400).json({ error: 'Player ID, episode ID, and choice ID are required' });
    }

    // Get choice details
    const { data: choice, error: choiceError } = await supabase
      .from('story_choices')
      .select('*')
      .eq('id', choice_id)
      .single();

    if (choiceError || !choice) {
      return res.status(404).json({ error: 'Choice not found' });
    }

    // Record player choice
    const { error: recordError } = await supabase
      .from('player_choices')
      .insert({
        player_id,
        episode_id,
        choice_id,
        choice_key: choice.choice_key,
        choice_data: { choice_text: choice.choice_text }
      });

    if (recordError) {
      return res.status(500).json({ error: recordError.message });
    }

    // Apply immediate consequences
    const consequences = choice.consequences || {};
    const consequenceRecords = [];

    for (const [type, value] of Object.entries(consequences)) {
      consequenceRecords.push({
        player_id,
        episode_id,
        consequence_type: type,
        consequence_key: `${choice.choice_key}_${type}`,
        consequence_value: { value, source: choice.choice_key }
      });
    }

    if (consequenceRecords.length > 0) {
      const { error: consequenceError } = await supabase
        .from('story_consequences')
        .insert(consequenceRecords);

      if (consequenceError) {
        console.error('Error recording consequences:', consequenceError);
      }
    }

    // Update player progress
    const nextChoiceKey = choice.next_choice_key;
    const isCompleted = choice.is_terminal || !nextChoiceKey;
    const newProgress = Math.min(100, (choice.choice_order + 1) * 25); // Rough progress calculation

    const { error: progressError } = await supabase
      .from('player_episode_progress')
      .upsert({
        player_id,
        episode_id,
        current_choice_key: nextChoiceKey,
        is_completed: isCompleted,
        completion_percentage: newProgress,
        completed_at: isCompleted ? new Date().toISOString() : null,
        last_accessed: new Date().toISOString()
      }, {
        onConflict: 'player_id,episode_id'
      });

    if (progressError) {
      return res.status(500).json({ error: progressError.message });
    }

    // Get next available choices if not terminal
    let nextChoices = [];
    if (!isCompleted && nextChoiceKey) {
      const { data: choices, error: nextChoicesError } = await supabase
        .from('story_choices')
        .select('*')
        .eq('episode_id', episode_id)
        .eq('choice_key', nextChoiceKey)
        .order('choice_order', { ascending: true });

      if (!nextChoicesError) {
        nextChoices = choices || [];
      }
    }

    res.json({
      success: true,
      consequences: consequences,
      next_choice_key: nextChoiceKey,
      next_choices: nextChoices,
      is_episode_completed: isCompleted,
      progress_percentage: newProgress
    });

  } catch (error) {
    console.error('Error making choice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get story consequences for a player
router.get('/consequences', async (req, res) => {
  try {
    const { player_id, episode_id } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    let query = supabase
      .from('story_consequences')
      .select(`
        *,
        story_episodes!inner(title, episode_number)
      `)
      .eq('player_id', player_id)
      .eq('is_active', true)
      .order('applied_at', { ascending: false });

    if (episode_id) {
      query = query.eq('episode_id', episode_id);
    }

    const { data: consequences, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Group consequences by type for easier processing
    const groupedConsequences = {
      reputation: [],
      credits: [],
      items: [],
      unlocks: [],
      relationships: [],
      other: []
    };

    consequences?.forEach(consequence => {
      const type = consequence.consequence_type;
      if (groupedConsequences[type]) {
        groupedConsequences[type].push(consequence);
      } else {
        groupedConsequences.other.push(consequence);
      }
    });

    // Calculate total effects
    const totalEffects = {
      reputation_change: groupedConsequences.reputation.reduce((sum, c) => 
        sum + (c.consequence_value?.value || 0), 0),
      credits_gained: groupedConsequences.credits.reduce((sum, c) => 
        sum + (c.consequence_value?.value || 0), 0),
      items_unlocked: groupedConsequences.items.length,
      features_unlocked: groupedConsequences.unlocks.length
    };

    res.json({
      consequences: consequences || [],
      grouped_consequences: groupedConsequences,
      total_effects: totalEffects
    });

  } catch (error) {
    console.error('Error fetching consequences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available episodes
router.get('/episodes', async (req, res) => {
  try {
    const { player_id } = req.query;

    // Get all episodes
    const { data: episodes, error: episodesError } = await supabase
      .from('story_episodes')
      .select('*')
      .eq('is_active', true)
      .order('episode_number', { ascending: true });

    if (episodesError) {
      return res.status(500).json({ error: episodesError.message });
    }

    // If player_id provided, get their progress
    let playerProgress = [];
    if (player_id) {
      const { data: progress, error: progressError } = await supabase
        .from('player_episode_progress')
        .select('*')
        .eq('player_id', player_id);

      if (!progressError) {
        playerProgress = progress || [];
      }
    }

    // Combine episode data with player progress
    const episodesWithProgress = episodes?.map(episode => {
      const progress = playerProgress.find(p => p.episode_id === episode.id);
      return {
        ...episode,
        player_progress: progress || null,
        is_unlocked: !progress ? episode.episode_number === 1 : true,
        is_completed: progress?.is_completed || false,
        completion_percentage: progress?.completion_percentage || 0
      };
    });

    res.json({
      episodes: episodesWithProgress || [],
      total_episodes: episodes?.length || 0
    });

  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;