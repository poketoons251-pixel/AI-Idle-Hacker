/**
 * Guild Wars API Routes
 * Handle guild war declarations, battles, and war management
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Declare war on another guild
 * POST /api/guild-wars/declare
 */
router.post('/declare', async (req: Request, res: Response): Promise<void> => {
  try {
    const { target_guild_id, war_type = 'standard', stakes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!target_guild_id) {
      res.status(400).json({ success: false, error: 'Target guild ID is required' });
      return;
    }

    // Check if user is a guild leader or officer
    const { data: userGuild, error: guildError } = await supabase
      .from('guild_members')
      .select(`
        guild_id,
        role,
        guild:guilds(
          id,
          name,
          level,
          treasury,
          member_count
        )
      `)
      .eq('user_id', userId)
      .single();

    if (guildError || !userGuild) {
      res.status(404).json({ success: false, error: 'You must be in a guild to declare war' });
      return;
    }

    if (!['leader', 'officer'].includes(userGuild.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Only guild leaders and officers can declare war' 
      });
      return;
    }

    if (userGuild.guild_id === target_guild_id) {
      res.status(400).json({ success: false, error: 'Cannot declare war on your own guild' });
      return;
    }

    // Check if target guild exists and get info
    const { data: targetGuild, error: targetError } = await supabase
      .from('guilds')
      .select('id, name, level, member_count')
      .eq('id', target_guild_id)
      .single();

    if (targetError || !targetGuild) {
      res.status(404).json({ success: false, error: 'Target guild not found' });
      return;
    }

    // Check if there's already an active war between these guilds
    const { data: existingWar } = await supabase
      .from('guild_wars')
      .select('id, status')
      .or(`and(attacker_guild_id.eq.${userGuild.guild_id},defender_guild_id.eq.${target_guild_id}),and(attacker_guild_id.eq.${target_guild_id},defender_guild_id.eq.${userGuild.guild_id})`)
      .in('status', ['pending', 'active'])
      .single();

    if (existingWar) {
      const message = existingWar.status === 'active' 
        ? 'There is already an active war with this guild'
        : 'There is already a pending war declaration with this guild';
      res.status(409).json({ success: false, error: message });
      return;
    }

    // Validate war type
    const validWarTypes = ['standard', 'siege', 'tournament', 'raid'];
    if (!validWarTypes.includes(war_type)) {
      res.status(400).json({ 
        success: false, 
        error: `Invalid war type. Must be one of: ${validWarTypes.join(', ')}` 
      });
      return;
    }

    // Calculate war duration based on type
    const warDurations = {
      standard: 24, // 24 hours
      siege: 72,    // 3 days
      tournament: 12, // 12 hours
      raid: 6       // 6 hours
    };

    const duration = warDurations[war_type as keyof typeof warDurations];
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

    // Create war declaration
    const { data: war, error } = await supabase
      .from('guild_wars')
      .insert({
        attacker_guild_id: userGuild.guild_id,
        defender_guild_id: target_guild_id,
        war_type,
        status: 'pending',
        stakes: stakes || {},
        declared_by: userId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        attacker_score: 0,
        defender_score: 0
      })
      .select(`
        *,
        attacker_guild:guilds!attacker_guild_id(
          id,
          name,
          level,
          member_count
        ),
        defender_guild:guilds!defender_guild_id(
          id,
          name,
          level,
          member_count
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        war,
        message: `War declared against ${targetGuild.name}! Waiting for their response.`
      }
    });
  } catch (error) {
    console.error('Declare war error:', error);
    res.status(500).json({ success: false, error: 'Failed to declare war' });
  }
});

/**
 * Respond to war declaration (accept/decline)
 * PUT /api/guild-wars/:id/respond
 */
router.put('/:id/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: warId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!['accept', 'decline'].includes(action)) {
      res.status(400).json({ success: false, error: 'Action must be accept or decline' });
      return;
    }

    // Get war details
    const { data: war, error: warError } = await supabase
      .from('guild_wars')
      .select('*')
      .eq('id', warId)
      .eq('status', 'pending')
      .single();

    if (warError || !war) {
      res.status(404).json({ success: false, error: 'War declaration not found' });
      return;
    }

    // Check if user is a leader/officer of the defending guild
    const { data: userGuild } = await supabase
      .from('guild_members')
      .select('guild_id, role')
      .eq('user_id', userId)
      .eq('guild_id', war.defender_guild_id)
      .single();

    if (!userGuild || !['leader', 'officer'].includes(userGuild.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Only defending guild leaders and officers can respond to war declarations' 
      });
      return;
    }

    if (action === 'accept') {
      // Accept the war - make it active
      const { error: updateError } = await supabase
        .from('guild_wars')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
          accepted_by: userId
        })
        .eq('id', warId);

      if (updateError) throw updateError;

      res.json({
        success: true,
        data: {
          status: 'accepted',
          message: 'War has been accepted! Let the battle begin!'
        }
      });
    } else {
      // Decline the war
      const { error: updateError } = await supabase
        .from('guild_wars')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
          declined_by: userId
        })
        .eq('id', warId);

      if (updateError) throw updateError;

      res.json({
        success: true,
        data: {
          status: 'declined',
          message: 'War declaration has been declined'
        }
      });
    }
  } catch (error) {
    console.error('Respond to war error:', error);
    res.status(500).json({ success: false, error: 'Failed to respond to war declaration' });
  }
});

/**
 * Get guild wars (active, pending, completed)
 * GET /api/guild-wars
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get user's guild
    const { data: userGuild } = await supabase
      .from('guild_members')
      .select('guild_id')
      .eq('user_id', userId)
      .single();

    if (!userGuild) {
      res.status(404).json({ success: false, error: 'You must be in a guild to view wars' });
      return;
    }

    // Build query
    let query = supabase
      .from('guild_wars')
      .select(`
        *,
        attacker_guild:guilds!attacker_guild_id(
          id,
          name,
          level,
          member_count
        ),
        defender_guild:guilds!defender_guild_id(
          id,
          name,
          level,
          member_count
        )
      `)
      .or(`attacker_guild_id.eq.${userGuild.guild_id},defender_guild_id.eq.${userGuild.guild_id}`);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: wars, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    // Process wars to show perspective from user's guild
    const processedWars = wars?.map(war => {
      const isAttacker = war.attacker_guild_id === userGuild.guild_id;
      return {
        ...war,
        is_attacker: isAttacker,
        opponent: isAttacker ? war.defender_guild : war.attacker_guild,
        our_score: isAttacker ? war.attacker_score : war.defender_score,
        opponent_score: isAttacker ? war.defender_score : war.attacker_score
      };
    }) || [];

    res.json({
      success: true,
      data: {
        wars: processedWars,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get guild wars error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch guild wars' });
  }
});

/**
 * Get specific war details
 * GET /api/guild-wars/:id
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: warId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get user's guild
    const { data: userGuild } = await supabase
      .from('guild_members')
      .select('guild_id')
      .eq('user_id', userId)
      .single();

    if (!userGuild) {
      res.status(404).json({ success: false, error: 'You must be in a guild to view wars' });
      return;
    }

    // Get war details
    const { data: war, error } = await supabase
      .from('guild_wars')
      .select(`
        *,
        attacker_guild:guilds!attacker_guild_id(
          id,
          name,
          level,
          member_count
        ),
        defender_guild:guilds!defender_guild_id(
          id,
          name,
          level,
          member_count
        )
      `)
      .eq('id', warId)
      .single();

    if (error || !war) {
      res.status(404).json({ success: false, error: 'War not found' });
      return;
    }

    // Check if user's guild is involved in this war
    if (war.attacker_guild_id !== userGuild.guild_id && war.defender_guild_id !== userGuild.guild_id) {
      res.status(403).json({ success: false, error: 'You can only view wars involving your guild' });
      return;
    }

    const isAttacker = war.attacker_guild_id === userGuild.guild_id;
    const processedWar = {
      ...war,
      is_attacker: isAttacker,
      opponent: isAttacker ? war.defender_guild : war.attacker_guild,
      our_score: isAttacker ? war.attacker_score : war.defender_score,
      opponent_score: isAttacker ? war.defender_score : war.attacker_score
    };

    res.json({
      success: true,
      data: { war: processedWar }
    });
  } catch (error) {
    console.error('Get war details error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch war details' });
  }
});

/**
 * Perform war action (attack, defend, special ability)
 * POST /api/guild-wars/:id/action
 */
router.post('/:id/action', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: warId } = req.params;
    const { action_type, target, power = 1 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const validActions = ['attack', 'defend', 'special', 'sabotage'];
    if (!validActions.includes(action_type)) {
      res.status(400).json({ 
        success: false, 
        error: `Invalid action. Must be one of: ${validActions.join(', ')}` 
      });
      return;
    }

    // Get war details
    const { data: war } = await supabase
      .from('guild_wars')
      .select('*')
      .eq('id', warId)
      .eq('status', 'active')
      .single();

    if (!war) {
      res.status(404).json({ success: false, error: 'Active war not found' });
      return;
    }

    // Check if war has ended
    if (new Date() > new Date(war.end_time)) {
      res.status(400).json({ success: false, error: 'War has already ended' });
      return;
    }

    // Get user's guild and verify participation
    const { data: userGuild } = await supabase
      .from('guild_members')
      .select('guild_id, role')
      .eq('user_id', userId)
      .single();

    if (!userGuild || (userGuild.guild_id !== war.attacker_guild_id && userGuild.guild_id !== war.defender_guild_id)) {
      res.status(403).json({ success: false, error: 'You can only participate in wars involving your guild' });
      return;
    }

    // Calculate action effectiveness based on user level and power
    const { data: user } = await supabase
      .from('users')
      .select('level, experience')
      .eq('id', userId)
      .single();

    const effectiveness = Math.min(Math.floor((user?.level || 1) * power * Math.random() * 2), 100);
    const isAttacker = userGuild.guild_id === war.attacker_guild_id;

    // Update war scores based on action
    let scoreUpdate = {};
    let actionResult = '';

    switch (action_type) {
      case 'attack':
        if (isAttacker) {
          scoreUpdate = { attacker_score: war.attacker_score + effectiveness };
          actionResult = `Dealt ${effectiveness} damage to the enemy!`;
        } else {
          scoreUpdate = { defender_score: war.defender_score + effectiveness };
          actionResult = `Counter-attacked for ${effectiveness} damage!`;
        }
        break;
      
      case 'defend':
        const defenseBonus = Math.floor(effectiveness * 0.5);
        if (isAttacker) {
          scoreUpdate = { attacker_score: war.attacker_score + defenseBonus };
        } else {
          scoreUpdate = { defender_score: war.defender_score + defenseBonus };
        }
        actionResult = `Strengthened defenses (+${defenseBonus} points)!`;
        break;
      
      case 'special':
        const specialBonus = Math.floor(effectiveness * 1.5);
        if (isAttacker) {
          scoreUpdate = { attacker_score: war.attacker_score + specialBonus };
        } else {
          scoreUpdate = { defender_score: war.defender_score + specialBonus };
        }
        actionResult = `Used special ability for ${specialBonus} points!`;
        break;
      
      case 'sabotage':
        const sabotageReduction = Math.floor(effectiveness * 0.3);
        if (isAttacker) {
          scoreUpdate = { 
            attacker_score: war.attacker_score + Math.floor(effectiveness * 0.7),
            defender_score: Math.max(0, war.defender_score - sabotageReduction)
          };
        } else {
          scoreUpdate = { 
            defender_score: war.defender_score + Math.floor(effectiveness * 0.7),
            attacker_score: Math.max(0, war.attacker_score - sabotageReduction)
          };
        }
        actionResult = `Sabotage successful! Reduced enemy score by ${sabotageReduction}!`;
        break;
    }

    // Update war scores
    const { error: updateError } = await supabase
      .from('guild_wars')
      .update(scoreUpdate)
      .eq('id', warId);

    if (updateError) throw updateError;

    // Record the action (using a hypothetical war_actions table)
    try {
      await supabase
        .from('war_actions')
        .insert({
          war_id: warId,
          user_id: userId,
          action_type,
          effectiveness,
          target,
          result: actionResult
        })
        .select()
        .single();
    } catch {
      // Ignore if table doesn't exist
    }

    res.json({
      success: true,
      data: {
        action_type,
        effectiveness,
        result: actionResult,
        new_scores: scoreUpdate
      }
    });
  } catch (error) {
    console.error('War action error:', error);
    res.status(500).json({ success: false, error: 'Failed to perform war action' });
  }
});

/**
 * End war manually (for leaders/officers)
 * PUT /api/guild-wars/:id/end
 */
router.put('/:id/end', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: warId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get war details
    const { data: war } = await supabase
      .from('guild_wars')
      .select('*')
      .eq('id', warId)
      .eq('status', 'active')
      .single();

    if (!war) {
      res.status(404).json({ success: false, error: 'Active war not found' });
      return;
    }

    // Check if user is a leader/officer of either guild
    const { data: userGuild } = await supabase
      .from('guild_members')
      .select('guild_id, role')
      .eq('user_id', userId)
      .single();

    if (!userGuild || 
        (userGuild.guild_id !== war.attacker_guild_id && userGuild.guild_id !== war.defender_guild_id) ||
        !['leader', 'officer'].includes(userGuild.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Only guild leaders and officers can end wars' 
      });
      return;
    }

    // Determine winner
    const winner = war.attacker_score > war.defender_score ? 'attacker' : 
                   war.defender_score > war.attacker_score ? 'defender' : 'draw';

    // End the war
    const { error } = await supabase
      .from('guild_wars')
      .update({
        status: 'completed',
        winner,
        ended_at: new Date().toISOString(),
        ended_by: userId
      })
      .eq('id', warId);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        status: 'completed',
        winner,
        final_scores: {
          attacker: war.attacker_score,
          defender: war.defender_score
        }
      }
    });
  } catch (error) {
    console.error('End war error:', error);
    res.status(500).json({ success: false, error: 'Failed to end war' });
  }
});

export default router;