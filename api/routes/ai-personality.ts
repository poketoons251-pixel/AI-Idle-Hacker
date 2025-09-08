import { Router } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

// Get AI personality traits
router.get('/traits', async (req, res) => {
  try {
    const { data: traits, error } = await supabase
      .from('personality_traits')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching traits:', error);
      return res.status(500).json({ error: 'Failed to fetch personality traits' });
    }

    // Return mock data if no traits found
    const mockTraits = [
      { id: '1', trait_name: 'Analytical', description: 'Logical and methodical approach', value: 75 },
      { id: '2', trait_name: 'Creative', description: 'Innovative and imaginative thinking', value: 60 },
      { id: '3', trait_name: 'Social', description: 'Strong interpersonal skills', value: 45 },
      { id: '4', trait_name: 'Ambitious', description: 'Goal-oriented and driven', value: 80 }
    ];

    res.json({ traits: traits && traits.length > 0 ? traits : mockTraits });
  } catch (error) {
    console.error('Traits fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get AI partners
router.get('/partners', async (req, res) => {
  try {
    const { data: partners, error } = await supabase
      .from('partner_personalities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching partners:', error);
      return res.status(500).json({ error: 'Failed to fetch AI partners' });
    }

    // Return mock data if no partners found
    const mockPartners = [
      {
        id: 'alex-chen',
        name: 'Alex Chen',
        role: 'Senior Developer',
        personality_type: 'analytical',
        trust_threshold: 70,
        is_active: true
      },
      {
        id: 'sarah-kim',
        name: 'Sarah Kim',
        role: 'Security Expert',
        personality_type: 'methodical',
        trust_threshold: 80,
        is_active: true
      }
    ];

    res.json({ partners: partners && partners.length > 0 ? partners : mockPartners });
  } catch (error) {
    console.error('Partners fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update relationship (for testing)
router.post('/update-relationship', async (req, res) => {
  try {
    const { player_id, partner_id, relationship_changes } = req.body;

    if (!player_id || !partner_id) {
      return res.status(400).json({ error: 'Player ID and Partner ID are required' });
    }

    // Mock response for now
    res.json({ 
      success: true, 
      message: 'Relationship updated successfully',
      changes: relationship_changes
    });
  } catch (error) {
    console.error('Update relationship error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;