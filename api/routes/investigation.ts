import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Get investigation targets
router.get('/targets', async (req, res) => {
  try {
    const { data: targets, error } = await supabase
      .from('investigation_targets')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching targets:', error);
      return res.status(500).json({ error: 'Failed to fetch targets' });
    }

    res.json({ targets: targets || [] });
  } catch (error) {
    console.error('Investigation targets error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get intelligence data
router.get('/intelligence', async (req, res) => {
  try {
    const { data: intelligence, error } = await supabase
      .from('intelligence_data')
      .select('*')
      .eq('is_verified', true)
      .order('gathered_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching intelligence:', error);
      return res.status(500).json({ error: 'Failed to fetch intelligence' });
    }

    res.json({ intelligence: intelligence || [] });
  } catch (error) {
    console.error('Intelligence fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get automation rules
router.get('/automation-rules', async (req, res) => {
  try {
    const { data: rules, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: false });

    if (error) {
      console.error('Error fetching automation rules:', error);
      return res.status(500).json({ error: 'Failed to fetch automation rules' });
    }

    res.json({ rules: rules || [] });
  } catch (error) {
    console.error('Automation rules error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start investigation (requires authentication)
router.post('/start', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { target_id, investigation_type, parameters } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: investigation, error } = await supabase
      .from('active_investigations')
      .insert({
        player_id: userId,
        target_id,
        investigation_type,
        parameters,
        status: 'active',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting investigation:', error);
      return res.status(500).json({ error: 'Failed to start investigation' });
    }

    res.json({ investigation });
  } catch (error) {
    console.error('Investigation start error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get investigation progress
router.get('/progress/:targetId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { targetId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: progress, error } = await supabase
      .from('investigation_progress')
      .select('*')
      .eq('player_id', userId)
      .eq('target_id', targetId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching progress:', error);
      return res.status(500).json({ error: 'Failed to fetch progress' });
    }

    res.json({ progress: progress || null });
  } catch (error) {
    console.error('Progress fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Execute investigation action
router.post('/execute', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { action_type, target_id, parameters } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Simulate investigation execution
    const result = {
      success: true,
      action_type,
      target_id,
      intelligence_gained: Math.floor(Math.random() * 100) + 50,
      resources_used: Math.floor(Math.random() * 20) + 10,
      completion_time: new Date().toISOString()
    };

    // Log the action
    const { error: logError } = await supabase
      .from('investigation_logs')
      .insert({
        player_id: userId,
        action_type,
        target_id,
        result,
        executed_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging investigation:', logError);
    }

    res.json({ result });
  } catch (error) {
    console.error('Investigation execution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset investigation
router.post('/reset/:targetId', authenticateUser, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { targetId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { error } = await supabase
      .from('investigation_progress')
      .delete()
      .eq('player_id', userId)
      .eq('target_id', targetId);

    if (error) {
      console.error('Error resetting investigation:', error);
      return res.status(500).json({ error: 'Failed to reset investigation' });
    }

    res.json({ success: true, message: 'Investigation reset successfully' });
  } catch (error) {
    console.error('Investigation reset error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;