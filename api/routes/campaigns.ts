import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Get all available campaigns
router.get('/metadata', async (req, res) => {
  try {
    const { data: campaigns, error } = await supabase
      .from('campaign_metadata')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return res.status(500).json({ error: 'Failed to fetch campaigns' });
    }

    res.json({ campaigns });
  } catch (error) {
    console.error('Campaign metadata error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get episodes for a specific campaign
router.get('/:campaignId/episodes', async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { includeContent = false } = req.query;

    let selectFields = 'id, campaign_id, episode_number, title, description, unlock_requirements, rewards, difficulty_level, estimated_duration, tags, is_active';
    if (includeContent === 'true') {
      selectFields += ', content';
    }

    const { data: episodes, error } = await supabase
      .from('campaign_episodes')
      .select(selectFields)
      .eq('campaign_id', campaignId)
      .eq('is_active', true)
      .order('episode_number', { ascending: true });

    if (error) {
      console.error('Error fetching episodes:', error);
      return res.status(500).json({ error: 'Failed to fetch episodes' });
    }

    res.json({ episodes });
  } catch (error) {
    console.error('Episodes fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific episode with full content
router.get('/:campaignId/episodes/:episodeNumber', async (req, res) => {
  try {
    const { campaignId, episodeNumber } = req.params;

    const { data: episode, error } = await supabase
      .from('campaign_episodes')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('episode_number', parseInt(episodeNumber))
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching episode:', error);
      return res.status(404).json({ error: 'Episode not found' });
    }

    res.json({ episode });
  } catch (error) {
    console.error('Episode fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player's campaign progress (requires authentication)
router.get('/progress', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: progress, error } = await supabase
      .from('campaign_progress')
      .select(`
        *,
        campaign_metadata!inner(
          campaign_id,
          title,
          description,
          theme,
          total_episodes
        )
      `)
      .eq('player_id', userId)
      .order('last_played_at', { ascending: false });

    if (error) {
      console.error('Error fetching progress:', error);
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }

    res.json({ progress });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player's progress for specific campaign
router.get('/:campaignId/progress', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { campaignId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: progress, error } = await supabase
      .from('campaign_progress')
      .select('*')
      .eq('player_id', userId)
      .eq('campaign_id', campaignId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching campaign progress:', error);
      return res.status(500).json({ error: 'Failed to fetch campaign progress' });
    }

    // If no progress exists, create initial progress
    if (!progress) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaign_metadata')
        .select('total_episodes')
        .eq('campaign_id', campaignId)
        .single();

      if (campaignError) {
        return res.status(404).json({ error: 'Campaign not found' });
      }

      const { data: newProgress, error: createError } = await supabase
        .from('campaign_progress')
        .insert({
          player_id: userId,
          campaign_id: campaignId,
          total_episodes: campaign.total_episodes,
          campaign_status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating progress:', createError);
        return res.status(500).json({ error: 'Failed to create progress' });
      }

      return res.json({ progress: newProgress });
    }

    res.json({ progress });
  } catch (error) {
    console.error('Campaign progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update campaign progress
router.put('/:campaignId/progress', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { campaignId } = req.params;
    const { 
      current_episode, 
      episodes_completed, 
      campaign_status, 
      choices_made, 
      total_playtime 
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Calculate completion percentage
    const { data: campaign, error: campaignError } = await supabase
      .from('campaign_metadata')
      .select('total_episodes')
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const completion_percentage = (episodes_completed / campaign.total_episodes) * 100;

    const updateData: any = {
      last_played_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (current_episode !== undefined) updateData.current_episode = current_episode;
    if (episodes_completed !== undefined) {
      updateData.episodes_completed = episodes_completed;
      updateData.completion_percentage = completion_percentage;
    }
    if (campaign_status) updateData.campaign_status = campaign_status;
    if (choices_made) updateData.choices_made = choices_made;
    if (total_playtime !== undefined) updateData.total_playtime = total_playtime;

    const { data: progress, error } = await supabase
      .from('campaign_progress')
      .update(updateData)
      .eq('player_id', userId)
      .eq('campaign_id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('Error updating progress:', error);
      return res.status(500).json({ error: 'Failed to update progress' });
    }

    res.json({ progress });
  } catch (error) {
    console.error('Progress update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get player's unlocked episodes
router.get('/:campaignId/unlocks', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { campaignId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: unlocks, error } = await supabase
      .from('episode_unlocks')
      .select('*')
      .eq('player_id', userId)
      .eq('campaign_id', campaignId)
      .order('episode_number', { ascending: true });

    if (error) {
      console.error('Error fetching unlocks:', error);
      return res.status(500).json({ error: 'Failed to fetch unlocks' });
    }

    res.json({ unlocks });
  } catch (error) {
    console.error('Unlocks fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unlock episode
router.post('/:campaignId/unlock/:episodeNumber', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { campaignId, episodeNumber } = req.params;
    const { unlock_method = 'manual', unlock_data = {} } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if episode exists
    const { data: episode, error: episodeError } = await supabase
      .from('campaign_episodes')
      .select('unlock_requirements')
      .eq('campaign_id', campaignId)
      .eq('episode_number', parseInt(episodeNumber))
      .single();

    if (episodeError) {
      return res.status(404).json({ error: 'Episode not found' });
    }

    // Check if already unlocked
    const { data: existingUnlock, error: checkError } = await supabase
      .from('episode_unlocks')
      .select('id')
      .eq('player_id', userId)
      .eq('campaign_id', campaignId)
      .eq('episode_number', parseInt(episodeNumber))
      .single();

    if (existingUnlock) {
      return res.status(400).json({ error: 'Episode already unlocked' });
    }

    // Create unlock record
    const { data: unlock, error } = await supabase
      .from('episode_unlocks')
      .insert({
        player_id: userId,
        campaign_id: campaignId,
        episode_number: parseInt(episodeNumber),
        unlock_method,
        unlock_data
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating unlock:', error);
      return res.status(500).json({ error: 'Failed to unlock episode' });
    }

    res.json({ unlock });
  } catch (error) {
    console.error('Episode unlock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Complete episode
router.post('/:campaignId/complete/:episodeNumber', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { campaignId, episodeNumber } = req.params;
    const { completion_data = {} } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Update unlock record to mark as completed
    const { data: unlock, error: unlockError } = await supabase
      .from('episode_unlocks')
      .update({
        is_completed: true,
        completed_at: new Date().toISOString(),
        completion_data
      })
      .eq('player_id', userId)
      .eq('campaign_id', campaignId)
      .eq('episode_number', parseInt(episodeNumber))
      .select()
      .single();

    if (unlockError) {
      console.error('Error completing episode:', unlockError);
      return res.status(500).json({ error: 'Failed to complete episode' });
    }

    // Update campaign progress
    const { data: progress, error: progressError } = await supabase
      .from('campaign_progress')
      .select('episodes_completed, total_episodes')
      .eq('player_id', userId)
      .eq('campaign_id', campaignId)
      .single();

    if (progress) {
      const newEpisodesCompleted = progress.episodes_completed + 1;
      const completion_percentage = (newEpisodesCompleted / progress.total_episodes) * 100;
      const campaign_status = completion_percentage >= 100 ? 'completed' : 'active';

      await supabase
        .from('campaign_progress')
        .update({
          episodes_completed: newEpisodesCompleted,
          completion_percentage,
          campaign_status,
          current_episode: parseInt(episodeNumber) + 1,
          last_played_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('player_id', userId)
        .eq('campaign_id', campaignId);
    }

    res.json({ unlock, message: 'Episode completed successfully' });
  } catch (error) {
    console.error('Episode completion error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get delivery schedule for automated content delivery
router.get('/delivery-schedule', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: schedule, error } = await supabase
      .from('episode_delivery_schedule')
      .select('*')
      .eq('player_id', userId)
      .eq('is_delivered', false)
      .lte('scheduled_unlock_at', new Date().toISOString())
      .order('scheduled_unlock_at', { ascending: true });

    if (error) {
      console.error('Error fetching delivery schedule:', error);
      return res.status(500).json({ error: 'Failed to fetch delivery schedule' });
    }

    res.json({ schedule });
  } catch (error) {
    console.error('Delivery schedule error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process scheduled deliveries (for idle gameplay)
router.post('/process-deliveries', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get pending deliveries
    const { data: pendingDeliveries, error: fetchError } = await supabase
      .from('episode_delivery_schedule')
      .select('*')
      .eq('player_id', userId)
      .eq('is_delivered', false)
      .lte('scheduled_unlock_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching pending deliveries:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch pending deliveries' });
    }

    const processedDeliveries = [];

    for (const delivery of pendingDeliveries || []) {
      // Auto-unlock the episode
      const { error: unlockError } = await supabase
        .from('episode_unlocks')
        .upsert({
          player_id: userId,
          campaign_id: delivery.campaign_id,
          episode_number: delivery.episode_number,
          unlock_method: 'scheduled_delivery',
          unlock_data: { delivery_id: delivery.id }
        });

      if (!unlockError) {
        // Mark delivery as completed
        await supabase
          .from('episode_delivery_schedule')
          .update({
            is_delivered: true,
            delivered_at: new Date().toISOString()
          })
          .eq('id', delivery.id);

        processedDeliveries.push(delivery);
      }
    }

    res.json({ 
      processed: processedDeliveries.length,
      deliveries: processedDeliveries 
    });
  } catch (error) {
    console.error('Delivery processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Auto-progress endpoint for idle gameplay
router.post('/auto-progress', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { speed_multiplier = 1, resource_allocation = 50 } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get player's active campaigns
    const { data: activeCampaigns, error: campaignsError } = await supabase
      .from('campaign_progress')
      .select(`
        *,
        campaign_metadata!inner(
          campaign_id,
          title,
          total_episodes
        )
      `)
      .eq('player_id', userId)
      .eq('campaign_status', 'active');

    if (campaignsError) {
      console.error('Error fetching active campaigns:', campaignsError);
      return res.status(500).json({ error: 'Failed to fetch active campaigns' });
    }

    let episodes_progressed = 0;
    const progression_results = [];

    // Process each active campaign
    for (const campaign of activeCampaigns || []) {
      const efficiency = Math.min(1.0, resource_allocation / 100 * speed_multiplier);
      const progress_chance = efficiency * 0.3; // 30% base chance with full efficiency

      if (Math.random() < progress_chance) {
        const next_episode = campaign.current_episode + 1;
        
        // Check if next episode exists
        const { data: nextEpisode, error: episodeError } = await supabase
          .from('campaign_episodes')
          .select('id, episode_number, unlock_requirements')
          .eq('campaign_id', campaign.campaign_id)
          .eq('episode_number', next_episode)
          .eq('is_active', true)
          .single();

        if (nextEpisode && !episodeError) {
          // Auto-unlock next episode
          const { error: unlockError } = await supabase
            .from('episode_unlocks')
            .upsert({
              player_id: userId,
              campaign_id: campaign.campaign_id,
              episode_number: next_episode,
              unlock_method: 'auto_progression',
              unlock_data: { efficiency, speed_multiplier }
            });

          if (!unlockError) {
            // Update campaign progress
            await supabase
              .from('campaign_progress')
              .update({
                current_episode: next_episode,
                last_played_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .eq('player_id', userId)
              .eq('campaign_id', campaign.campaign_id);

            episodes_progressed++;
            progression_results.push({
              campaign_id: campaign.campaign_id,
              campaign_title: campaign.campaign_metadata.title,
              episode_unlocked: next_episode
            });
          }
        }
      }
    }

    res.json({
      episodes_progressed,
      progression_results,
      efficiency: resource_allocation / 100 * speed_multiplier
    });
  } catch (error) {
    console.error('Auto-progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;