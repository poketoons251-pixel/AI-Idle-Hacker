/**
 * Cross-Platform Sync API Routes
 * Handle account linking, cloud saves, and device synchronization
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';
import crypto from 'crypto';

const router = Router();

/**
 * Link account to another platform
 * POST /api/sync/link
 */
router.post('/link', async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, platform_user_id, platform_username } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!platform || !platform_user_id) {
      res.status(400).json({ 
        success: false, 
        error: 'Platform and platform_user_id are required' 
      });
      return;
    }

    const validPlatforms = ['steam', 'discord', 'google', 'apple', 'facebook'];
    if (!validPlatforms.includes(platform)) {
      res.status(400).json({ 
        success: false, 
        error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` 
      });
      return;
    }

    // Check if this platform account is already linked to another user
    const { data: existingLink } = await supabase
      .from('cross_platform_links')
      .select('id, user_id')
      .eq('platform', platform)
      .eq('platform_user_id', platform_user_id)
      .single();

    if (existingLink && existingLink.user_id !== userId) {
      res.status(409).json({ 
        success: false, 
        error: 'This platform account is already linked to another user' 
      });
      return;
    }

    if (existingLink && existingLink.user_id === userId) {
      res.status(400).json({ 
        success: false, 
        error: 'This platform account is already linked to your account' 
      });
      return;
    }

    // Generate sync token for this link
    const syncToken = crypto.randomBytes(32).toString('hex');

    // Create platform link
    const { data: link, error } = await supabase
      .from('cross_platform_links')
      .insert({
        user_id: userId,
        platform,
        platform_user_id,
        platform_username,
        sync_token: syncToken,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        link_id: link.id,
        platform: link.platform,
        platform_username: link.platform_username,
        sync_token: syncToken,
        linked_at: link.created_at
      }
    });
  } catch (error) {
    console.error('Link platform account error:', error);
    res.status(500).json({ success: false, error: 'Failed to link platform account' });
  }
});

/**
 * Get linked platform accounts
 * GET /api/sync/links
 */
router.get('/links', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { data: links, error } = await supabase
      .from('cross_platform_links')
      .select(`
        id,
        platform,
        platform_username,
        is_active,
        last_sync_at,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        links: links || [],
        total_links: links?.length || 0
      }
    });
  } catch (error) {
    console.error('Get platform links error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch platform links' });
  }
});

/**
 * Unlink platform account
 * DELETE /api/sync/links/:id
 */
router.delete('/links/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: linkId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Verify link belongs to user
    const { data: link } = await supabase
      .from('cross_platform_links')
      .select('id')
      .eq('id', linkId)
      .eq('user_id', userId)
      .single();

    if (!link) {
      res.status(404).json({ success: false, error: 'Platform link not found' });
      return;
    }

    // Delete the link
    const { error } = await supabase
      .from('cross_platform_links')
      .delete()
      .eq('id', linkId);

    if (error) throw error;

    res.json({
      success: true,
      data: { status: 'unlinked' }
    });
  } catch (error) {
    console.error('Unlink platform account error:', error);
    res.status(500).json({ success: false, error: 'Failed to unlink platform account' });
  }
});

/**
 * Create cloud save
 * POST /api/sync/save
 */
router.post('/save', async (req: Request, res: Response): Promise<void> => {
  try {
    const { save_data, device_info, save_name } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!save_data) {
      res.status(400).json({ success: false, error: 'Save data is required' });
      return;
    }

    // Validate save data size (max 1MB)
    const saveDataSize = JSON.stringify(save_data).length;
    if (saveDataSize > 1024 * 1024) {
      res.status(413).json({ 
        success: false, 
        error: 'Save data too large (max 1MB)' 
      });
      return;
    }

    // Get current user data for the save
    const { data: userData } = await supabase
      .from('users')
      .select('level, experience, currency, achievements')
      .eq('id', userId)
      .single();

    const savePayload = {
      user_id: userId,
      save_name: save_name || `Auto Save ${new Date().toLocaleString()}`,
      save_data: {
        ...save_data,
        user_stats: userData,
        timestamp: new Date().toISOString()
      },
      device_info: device_info || {},
      save_size: saveDataSize
    };

    // Create cloud save (using a hypothetical cloud_saves table)
    const { data: cloudSave, error } = await supabase
      .from('cloud_saves')
      .insert(savePayload)
      .select()
      .single();

    if (error) {
      // If table doesn't exist, return a placeholder response
      if (error.code === '42P01') {
        res.status(501).json({ 
          success: false, 
          error: 'Cloud saves not yet implemented in database' 
        });
        return;
      }
      throw error;
    }

    // Update last sync time for all platform links
    await supabase
      .from('cross_platform_links')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('user_id', userId);

    res.status(201).json({
      success: true,
      data: {
        save_id: cloudSave.id,
        save_name: cloudSave.save_name,
        save_size: cloudSave.save_size,
        created_at: cloudSave.created_at
      }
    });
  } catch (error) {
    console.error('Create cloud save error:', error);
    res.status(500).json({ success: false, error: 'Failed to create cloud save' });
  }
});

/**
 * Get cloud saves
 * GET /api/sync/saves
 */
router.get('/saves', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { data: saves, error } = await supabase
      .from('cloud_saves')
      .select(`
        id,
        save_name,
        save_size,
        device_info,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      // If table doesn't exist, return empty saves
      if (error.code === '42P01') {
        res.json({
          success: true,
          data: {
            saves: [],
            pagination: {
              page: Number(page),
              limit: Number(limit)
            }
          }
        });
        return;
      }
      throw error;
    }

    res.json({
      success: true,
      data: {
        saves: saves || [],
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get cloud saves error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch cloud saves' });
  }
});

/**
 * Load cloud save
 * GET /api/sync/saves/:id
 */
router.get('/saves/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: saveId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { data: save, error } = await supabase
      .from('cloud_saves')
      .select('*')
      .eq('id', saveId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === '42P01') {
        res.status(501).json({ 
          success: false, 
          error: 'Cloud saves not yet implemented in database' 
        });
        return;
      }
      if (error.code === 'PGRST116') {
        res.status(404).json({ success: false, error: 'Cloud save not found' });
        return;
      }
      throw error;
    }

    res.json({
      success: true,
      data: { save }
    });
  } catch (error) {
    console.error('Load cloud save error:', error);
    res.status(500).json({ success: false, error: 'Failed to load cloud save' });
  }
});

/**
 * Delete cloud save
 * DELETE /api/sync/saves/:id
 */
router.delete('/saves/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: saveId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Verify save belongs to user
    const { data: save } = await supabase
      .from('cloud_saves')
      .select('id')
      .eq('id', saveId)
      .eq('user_id', userId)
      .single();

    if (!save) {
      res.status(404).json({ success: false, error: 'Cloud save not found' });
      return;
    }

    // Delete the save
    const { error } = await supabase
      .from('cloud_saves')
      .delete()
      .eq('id', saveId);

    if (error) throw error;

    res.json({
      success: true,
      data: { status: 'deleted' }
    });
  } catch (error) {
    console.error('Delete cloud save error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete cloud save' });
  }
});

/**
 * Synchronize data across platforms
 * POST /api/sync/synchronize
 */
router.post('/synchronize', async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform, sync_token } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!platform || !sync_token) {
      res.status(400).json({ 
        success: false, 
        error: 'Platform and sync_token are required' 
      });
      return;
    }

    // Verify sync token
    const { data: link } = await supabase
      .from('cross_platform_links')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .eq('sync_token', sync_token)
      .eq('is_active', true)
      .single();

    if (!link) {
      res.status(403).json({ 
        success: false, 
        error: 'Invalid sync token or platform not linked' 
      });
      return;
    }

    // Get latest user data for synchronization
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Get user's companions
    const { data: companions } = await supabase
      .from('ai_companions')
      .select('*')
      .eq('user_id', userId);

    // Get user's guild membership
    const { data: guildMembership } = await supabase
      .from('guild_members')
      .select(`
        *,
        guild:guilds(*)
      `)
      .eq('user_id', userId)
      .single();

    // Update last sync time
    await supabase
      .from('cross_platform_links')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', link.id);

    const syncData = {
      user: userData,
      companions: companions || [],
      guild: guildMembership?.guild || null,
      sync_timestamp: new Date().toISOString(),
      platform: platform
    };

    res.json({
      success: true,
      data: {
        sync_data: syncData,
        last_sync: link.last_sync_at
      }
    });
  } catch (error) {
    console.error('Synchronize data error:', error);
    res.status(500).json({ success: false, error: 'Failed to synchronize data' });
  }
});

/**
 * Get sync status
 * GET /api/sync/status
 */
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get platform links with sync status
    const { data: links } = await supabase
      .from('cross_platform_links')
      .select('platform, is_active, last_sync_at, created_at')
      .eq('user_id', userId);

    // Get cloud saves count
    const { count: savesCount } = await supabase
      .from('cloud_saves')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const syncStatus = {
      linked_platforms: links?.length || 0,
      active_links: links?.filter(l => l.is_active).length || 0,
      cloud_saves: savesCount || 0,
      last_sync: links?.reduce((latest, link) => {
        if (!link.last_sync_at) return latest;
        if (!latest) return link.last_sync_at;
        return new Date(link.last_sync_at) > new Date(latest) ? link.last_sync_at : latest;
      }, null as string | null),
      platforms: links?.map(link => ({
        platform: link.platform,
        is_active: link.is_active,
        last_sync: link.last_sync_at,
        linked_at: link.created_at
      })) || []
    };

    res.json({
      success: true,
      data: { sync_status: syncStatus }
    });
  } catch (error) {
    console.error('Get sync status error:', error);
    res.status(500).json({ success: false, error: 'Failed to get sync status' });
  }
});

export default router;