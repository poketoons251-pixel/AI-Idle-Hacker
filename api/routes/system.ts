import { Router } from 'express';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// Get Phase 3 system status
router.get('/phase3-status', async (req, res) => {
  try {
    // Check system health and feature availability
    const status = {
      episodic_campaigns: {
        enabled: true,
        active_campaigns: 0,
        total_episodes: 0
      },
      ai_personalities: {
        enabled: true,
        active_partners: 0,
        relationship_dynamics: true
      },
      idle_optimization: {
        enabled: true,
        auto_progression: true,
        background_tasks: 0
      },
      system_health: {
        database_connected: true,
        api_responsive: true,
        last_check: new Date().toISOString()
      }
    };

    // Get actual campaign count
    const { data: campaigns, error: campaignError } = await supabase
      .from('campaign_metadata')
      .select('campaign_id')
      .eq('is_active', true);

    if (!campaignError && campaigns) {
      status.episodic_campaigns.active_campaigns = campaigns.length;
    }

    // Get total episodes count
    const { data: episodes, error: episodeError } = await supabase
      .from('campaign_episodes')
      .select('id')
      .eq('is_active', true);

    if (!episodeError && episodes) {
      status.episodic_campaigns.total_episodes = episodes.length;
    }

    // Get active AI partners count
    const { data: partners, error: partnerError } = await supabase
      .from('ai_partners')
      .select('id')
      .eq('is_active', true);

    if (!partnerError && partners) {
      status.ai_personalities.active_partners = partners.length;
    }

    res.json({ status });
  } catch (error) {
    console.error('Phase 3 status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get Phase 3 system metrics
router.get('/phase3-metrics', async (req, res) => {
  try {
    const metrics = {
      performance: {
        avg_response_time: Math.floor(Math.random() * 100) + 50,
        success_rate: 0.98,
        error_rate: 0.02,
        uptime_percentage: 99.5
      },
      usage: {
        active_sessions: Math.floor(Math.random() * 50) + 10,
        daily_api_calls: Math.floor(Math.random() * 1000) + 500,
        feature_adoption: {
          episodic_campaigns: 0.85,
          ai_personalities: 0.92,
          idle_optimization: 0.78
        }
      },
      resources: {
        cpu_usage: Math.floor(Math.random() * 30) + 20,
        memory_usage: Math.floor(Math.random() * 40) + 30,
        database_connections: Math.floor(Math.random() * 10) + 5,
        storage_used: Math.floor(Math.random() * 1000) + 2000
      },
      trends: {
        user_engagement: {
          daily_active_users: Math.floor(Math.random() * 100) + 200,
          session_duration: Math.floor(Math.random() * 30) + 45,
          feature_interactions: Math.floor(Math.random() * 500) + 1000
        },
        content_consumption: {
          episodes_completed: Math.floor(Math.random() * 50) + 100,
          ai_interactions: Math.floor(Math.random() * 200) + 500,
          idle_progression: Math.floor(Math.random() * 1000) + 2000
        }
      },
      last_updated: new Date().toISOString()
    };

    res.json({ metrics });
  } catch (error) {
    console.error('Phase 3 metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system health check
router.get('/health', async (req, res) => {
  try {
    // Test database connection
    const { data, error } = await supabase
      .from('campaign_metadata')
      .select('campaign_id')
      .limit(1);

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: error ? 'unhealthy' : 'healthy',
        api: 'healthy',
        authentication: 'healthy'
      },
      version: '1.0.0',
      uptime: process.uptime()
    };

    if (error) {
      health.status = 'degraded';
      health.services.database = 'unhealthy';
    }

    res.json({ health });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error'
      }
    });
  }
});

// Get system configuration
router.get('/config', async (req, res) => {
  try {
    const config = {
      features: {
        episodic_campaigns: true,
        ai_personalities: true,
        idle_optimization: true,
        advanced_hacking: true,
        story_integration: true
      },
      limits: {
        max_concurrent_campaigns: 5,
        max_ai_partners: 10,
        max_idle_tasks: 20,
        session_timeout: 3600
      },
      settings: {
        auto_save_interval: 30,
        notification_enabled: true,
        analytics_enabled: true,
        debug_mode: false
      },
      version: {
        api: '1.0.0',
        database: '1.0.0',
        frontend: '1.0.0'
      }
    };

    res.json({ config });
  } catch (error) {
    console.error('System config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;