/**
 * Guild Management API Routes
 * Handle guild creation, joining, management, and member operations
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Create a new guild
 * POST /api/guilds
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, is_public = true, max_members = 50 } = req.body;
    const userId = req.user?.id; // Assuming auth middleware sets req.user

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!name || name.length < 3 || name.length > 30) {
      res.status(400).json({ success: false, error: 'Guild name must be 3-30 characters' });
      return;
    }

    // Check if user is already in a guild
    const { data: existingMembership } = await supabase
      .from('guild_members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      res.status(400).json({ success: false, error: 'You are already a member of a guild' });
      return;
    }

    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create guild
    const { data: guild, error: guildError } = await supabase
      .from('guilds')
      .insert({
        name,
        description,
        leader_id: userId,
        is_public,
        max_members,
        invite_code: inviteCode
      })
      .select()
      .single();

    if (guildError) {
      if (guildError.code === '23505') { // Unique constraint violation
        res.status(400).json({ success: false, error: 'Guild name already exists' });
        return;
      }
      throw guildError;
    }

    // Add creator as guild leader
    const { error: memberError } = await supabase
      .from('guild_members')
      .insert({
        guild_id: guild.id,
        user_id: userId,
        role: 'leader'
      });

    if (memberError) throw memberError;

    res.status(201).json({
      success: true,
      data: {
        guild_id: guild.id,
        name: guild.name,
        invite_code: guild.invite_code,
        status: 'created'
      }
    });
  } catch (error) {
    console.error('Create guild error:', error);
    res.status(500).json({ success: false, error: 'Failed to create guild' });
  }
});

/**
 * Get all public guilds or user's guild
 * GET /api/guilds
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('guilds')
      .select(`
        id,
        name,
        description,
        current_members,
        max_members,
        level,
        is_public,
        created_at
      `)
      .eq('is_public', true)
      .order('level', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: guilds, error } = await query;

    if (error) throw error;

    // If user is authenticated, also get their guild membership
    let userGuild = null;
    if (userId) {
      const { data: membership } = await supabase
        .from('guild_members')
        .select(`
          role,
          guilds (
            id,
            name,
            description,
            current_members,
            max_members,
            level,
            treasury
          )
        `)
        .eq('user_id', userId)
        .single();

      if (membership) {
        userGuild = {
          ...membership.guilds,
          user_role: membership.role
        };
      }
    }

    res.json({
      success: true,
      data: {
        guilds,
        user_guild: userGuild,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get guilds error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guilds' });
  }
});

/**
 * Join a guild
 * POST /api/guilds/:id/join
 */
router.post('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: guildId } = req.params;
    const { invite_code, application_message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Check if user is already in a guild
    const { data: existingMembership } = await supabase
      .from('guild_members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      res.status(400).json({ success: false, error: 'You are already a member of a guild' });
      return;
    }

    // Get guild information
    const { data: guild, error: guildError } = await supabase
      .from('guilds')
      .select('*')
      .eq('id', guildId)
      .single();

    if (guildError || !guild) {
      res.status(404).json({ success: false, error: 'Guild not found' });
      return;
    }

    // Check if guild is full
    if (guild.current_members >= guild.max_members) {
      res.status(400).json({ success: false, error: 'Guild is full' });
      return;
    }

    // Verify invite code if guild is private
    if (!guild.is_public && guild.invite_code !== invite_code) {
      res.status(400).json({ success: false, error: 'Invalid invite code' });
      return;
    }

    // Add user to guild
    const { error: memberError } = await supabase
      .from('guild_members')
      .insert({
        guild_id: guildId,
        user_id: userId,
        role: 'member'
      });

    if (memberError) throw memberError;

    // Update guild member count
    const { error: updateError } = await supabase
      .from('guilds')
      .update({ current_members: guild.current_members + 1 })
      .eq('id', guildId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: {
        guild_id: guildId,
        guild_name: guild.name,
        status: 'joined'
      }
    });
  } catch (error) {
    console.error('Join guild error:', error);
    res.status(500).json({ success: false, error: 'Failed to join guild' });
  }
});

/**
 * Get guild members
 * GET /api/guilds/:id/members
 */
router.get('/:id/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: guildId } = req.params;
    const userId = req.user?.id;

    // Verify user is a member of this guild or guild is public
    const { data: guild } = await supabase
      .from('guilds')
      .select('is_public')
      .eq('id', guildId)
      .single();

    if (!guild) {
      res.status(404).json({ success: false, error: 'Guild not found' });
      return;
    }

    let canView = guild.is_public;
    if (!canView && userId) {
      const { data: membership } = await supabase
        .from('guild_members')
        .select('id')
        .eq('guild_id', guildId)
        .eq('user_id', userId)
        .single();
      canView = !!membership;
    }

    if (!canView) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Get guild members with user info
    const { data: members, error } = await supabase
      .from('guild_members')
      .select(`
        id,
        role,
        contribution_points,
        joined_at,
        last_active,
        users (
          id,
          username,
          level,
          avatar_url
        )
      `)
      .eq('guild_id', guildId)
      .order('role', { ascending: false })
      .order('contribution_points', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: { members }
    });
  } catch (error) {
    console.error('Get guild members error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guild members' });
  }
});

/**
 * Update guild settings
 * PUT /api/guilds/:id
 */
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: guildId } = req.params;
    const { description, is_public, max_members } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Verify user is guild leader or officer
    const { data: membership } = await supabase
      .from('guild_members')
      .select('role')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();

    if (!membership || !['leader', 'officer'].includes(membership.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    // Update guild
    const updateData: any = { updated_at: new Date().toISOString() };
    if (description !== undefined) updateData.description = description;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (max_members !== undefined && max_members >= 10 && max_members <= 100) {
      updateData.max_members = max_members;
    }

    const { data: guild, error } = await supabase
      .from('guilds')
      .update(updateData)
      .eq('id', guildId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: { guild }
    });
  } catch (error) {
    console.error('Update guild error:', error);
    res.status(500).json({ success: false, error: 'Failed to update guild' });
  }
});

/**
 * Leave guild
 * DELETE /api/guilds/:id/leave
 */
router.delete('/:id/leave', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: guildId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get user's membership
    const { data: membership } = await supabase
      .from('guild_members')
      .select('role')
      .eq('guild_id', guildId)
      .eq('user_id', userId)
      .single();

    if (!membership) {
      res.status(404).json({ success: false, error: 'You are not a member of this guild' });
      return;
    }

    // Leaders cannot leave unless they transfer leadership
    if (membership.role === 'leader') {
      const { data: otherMembers } = await supabase
        .from('guild_members')
        .select('id')
        .eq('guild_id', guildId)
        .neq('user_id', userId);

      if (otherMembers && otherMembers.length > 0) {
        res.status(400).json({ 
          success: false, 
          error: 'Guild leaders must transfer leadership before leaving' 
        });
        return;
      }
    }

    // Remove user from guild
    const { error: removeError } = await supabase
      .from('guild_members')
      .delete()
      .eq('guild_id', guildId)
      .eq('user_id', userId);

    if (removeError) throw removeError;

    // Update guild member count
    const { error: updateError } = await supabase
      .rpc('decrement_guild_members', { guild_id: guildId });

    if (updateError) {
      // Fallback to manual update
      const { data: guild } = await supabase
        .from('guilds')
        .select('current_members')
        .eq('id', guildId)
        .single();

      if (guild) {
        await supabase
          .from('guilds')
          .update({ current_members: Math.max(0, guild.current_members - 1) })
          .eq('id', guildId);
      }
    }

    res.json({
      success: true,
      data: { status: 'left' }
    });
  } catch (error) {
    console.error('Leave guild error:', error);
    res.status(500).json({ success: false, error: 'Failed to leave guild' });
  }
});

export default router;