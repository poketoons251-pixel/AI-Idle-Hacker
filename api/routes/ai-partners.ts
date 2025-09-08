import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Initialize AI partners system for a player
router.post('/initialize', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all active partner personalities
    const { data: partners, error: partnersError } = await supabase
      .from('partner_personalities')
      .select('partner_id, trust_threshold')
      .eq('is_active', true);

    if (partnersError) {
      console.error('Error fetching partners:', partnersError);
      return res.status(500).json({ error: 'Failed to initialize AI partners' });
    }

    // Initialize relationships for each partner if not exists
    const relationshipPromises = partners.map(async (partner) => {
      const { data: existingRelationship } = await supabase
        .from('relationship_dynamics')
        .select('id')
        .eq('player_id', userId)
        .eq('partner_id', partner.partner_id)
        .single();

      if (!existingRelationship) {
        return supabase
          .from('relationship_dynamics')
          .insert({
            player_id: userId,
            partner_id: partner.partner_id,
            relationship_type: 'professional',
            trust_level: Math.max(0, partner.trust_threshold - 20),
            respect_level: 25,
            intimacy_level: 0,
            conflict_level: 0,
            compatibility_score: 50.00
          });
      }
      return null;
    });

    await Promise.all(relationshipPromises.filter(Boolean));

    res.json({ 
      success: true, 
      message: 'AI partners system initialized successfully',
      partners_count: partners.length
    });
  } catch (error) {
    console.error('AI partners initialization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Initialize relationships system for a player
router.post('/relationships/initialize', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get all active partner personalities
    const { data: partners, error: partnersError } = await supabase
      .from('partner_personalities')
      .select('partner_id, trust_threshold')
      .eq('is_active', true);

    if (partnersError) {
      console.error('Error fetching partners for relationships:', partnersError);
      return res.status(500).json({ error: 'Failed to initialize relationships' });
    }

    // Initialize relationships for each partner if not exists
    const relationshipPromises = partners.map(async (partner) => {
      const { data: existingRelationship } = await supabase
        .from('relationship_dynamics')
        .select('id')
        .eq('player_id', userId)
        .eq('partner_id', partner.partner_id)
        .single();

      if (!existingRelationship) {
        return supabase
          .from('relationship_dynamics')
          .insert({
            player_id: userId,
            partner_id: partner.partner_id,
            relationship_type: 'professional',
            trust_level: Math.max(0, partner.trust_threshold - 20),
            respect_level: 25,
            intimacy_level: 0,
            conflict_level: 0,
            compatibility_score: 50.00
          });
      }
      return null;
    });

    await Promise.all(relationshipPromises.filter(Boolean));

    res.json({ 
      success: true, 
      message: 'Relationships system initialized successfully',
      relationships_count: partners.length
    });
  } catch (error) {
    console.error('Relationships initialization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available partner personalities
router.get('/personalities', async (req, res) => {
  try {
    const { data: personalities, error } = await supabase
      .from('partner_personalities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching personalities:', error);
      return res.status(500).json({ error: 'Failed to fetch personalities' });
    }

    res.json({ personalities });
  } catch (error) {
    console.error('Personalities fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get relationship data for a specific partner
router.get('/relationships/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { player_id } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    const { data: relationship, error } = await supabase
      .from('relationship_dynamics')
      .select('*')
      .eq('player_id', player_id)
      .eq('partner_id', partnerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching relationship:', error);
      return res.status(500).json({ error: 'Failed to fetch relationship data' });
    }

    // Return default relationship if none exists
    const defaultRelationship = {
      player_id,
      partner_id: partnerId,
      relationship_type: 'professional',
      trust_level: 25,
      respect_level: 25,
      intimacy_level: 0,
      conflict_level: 0,
      compatibility_score: 50.00
    };

    res.json({ relationship: relationship || defaultRelationship });
  } catch (error) {
    console.error('Relationship fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get interaction history for a specific partner
router.get('/interactions/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { player_id, timeRange = '7d' } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    const { data: interactions, error } = await supabase
      .from('interaction_history')
      .select('*')
      .eq('player_id', player_id)
      .eq('partner_id', partnerId)
      .gte('interaction_date', startDate.toISOString())
      .order('interaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching interactions:', error);
      return res.status(500).json({ error: 'Failed to fetch interaction history' });
    }

    res.json({ interactions: interactions || [] });
  } catch (error) {
    console.error('Interactions fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get relationship events for a specific partner
router.get('/relationships/:partnerId/events', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { player_id, timeRange = '7d' } = req.query;

    if (!player_id) {
      return res.status(400).json({ error: 'Player ID is required' });
    }

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '30d' ? 30 : timeRange === '7d' ? 7 : 1;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    const { data: events, error } = await supabase
      .from('relationship_events')
      .select('*')
      .eq('player_id', player_id)
      .eq('partner_id', partnerId)
      .gte('event_date', startDate.toISOString())
      .order('event_date', { ascending: false });

    if (error) {
      console.error('Error fetching relationship events:', error);
      return res.status(500).json({ error: 'Failed to fetch relationship events' });
    }

    res.json({ events: events || [] });
  } catch (error) {
    console.error('Relationship events fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;