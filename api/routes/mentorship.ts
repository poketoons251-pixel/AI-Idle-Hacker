/**
 * Mentorship System API Routes
 * Handle mentor-mentee relationships, matching, and progress tracking
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Request mentorship (as mentee)
 * POST /api/mentorship/request
 */
router.post('/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { mentor_id, message, focus_areas } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!mentor_id) {
      res.status(400).json({ success: false, error: 'Mentor ID is required' });
      return;
    }

    if (mentor_id === userId) {
      res.status(400).json({ success: false, error: 'Cannot request mentorship from yourself' });
      return;
    }

    // Check if mentor exists and is available
    const { data: mentor, error: mentorError } = await supabase
      .from('users')
      .select('id, username, level, experience')
      .eq('id', mentor_id)
      .single();

    if (mentorError || !mentor) {
      res.status(404).json({ success: false, error: 'Mentor not found' });
      return;
    }

    // Get mentee info
    const { data: mentee } = await supabase
      .from('users')
      .select('id, username, level, experience')
      .eq('id', userId)
      .single();

    // Check if there's already an active mentorship between these users
    const { data: existingMentorship } = await supabase
      .from('mentorships')
      .select('id, status')
      .eq('mentor_id', mentor_id)
      .eq('mentee_id', userId)
      .in('status', ['pending', 'active'])
      .single();

    if (existingMentorship) {
      const message = existingMentorship.status === 'active' 
        ? 'You already have an active mentorship with this user'
        : 'You already have a pending mentorship request with this user';
      res.status(409).json({ success: false, error: message });
      return;
    }

    // Check mentor's current mentee count (limit to 5 active mentorships)
    const { data: activeMentorships, error: countError } = await supabase
      .from('mentorships')
      .select('id')
      .eq('mentor_id', mentor_id)
      .eq('status', 'active');

    if (countError) throw countError;

    if (activeMentorships && activeMentorships.length >= 5) {
      res.status(400).json({ 
        success: false, 
        error: 'This mentor has reached their maximum number of mentees' 
      });
      return;
    }

    // Create mentorship request
    const { data: mentorship, error } = await supabase
      .from('mentorships')
      .insert({
        mentor_id,
        mentee_id: userId,
        status: 'pending',
        focus_areas: focus_areas || [],
        request_message: message || '',
        progress: {
          milestones_completed: 0,
          total_sessions: 0,
          last_session: null
        }
      })
      .select(`
        *,
        mentor:users!mentor_id(
          id,
          username,
          level,
          experience
        ),
        mentee:users!mentee_id(
          id,
          username,
          level,
          experience
        )
      `)
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        mentorship,
        message: `Mentorship request sent to ${mentor.username}!`
      }
    });
  } catch (error) {
    console.error('Request mentorship error:', error);
    res.status(500).json({ success: false, error: 'Failed to request mentorship' });
  }
});

/**
 * Respond to mentorship request (accept/decline)
 * PUT /api/mentorship/:id/respond
 */
router.put('/:id/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: mentorshipId } = req.params;
    const { action, response_message } = req.body; // 'accept' or 'decline'
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!['accept', 'decline'].includes(action)) {
      res.status(400).json({ success: false, error: 'Action must be accept or decline' });
      return;
    }

    // Get mentorship request
    const { data: mentorship, error: mentorshipError } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', mentorshipId)
      .eq('status', 'pending')
      .single();

    if (mentorshipError || !mentorship) {
      res.status(404).json({ success: false, error: 'Mentorship request not found' });
      return;
    }

    // Check if user is the mentor
    if (mentorship.mentor_id !== userId) {
      res.status(403).json({ 
        success: false, 
        error: 'Only the mentor can respond to this request' 
      });
      return;
    }

    if (action === 'accept') {
      // Accept the mentorship
      const { error: updateError } = await supabase
        .from('mentorships')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
          response_message: response_message || 'Welcome! I look forward to mentoring you.'
        })
        .eq('id', mentorshipId);

      if (updateError) throw updateError;

      res.json({
        success: true,
        data: {
          status: 'accepted',
          message: 'Mentorship request accepted! The mentoring relationship is now active.'
        }
      });
    } else {
      // Decline the mentorship
      const { error: updateError } = await supabase
        .from('mentorships')
        .update({
          status: 'declined',
          declined_at: new Date().toISOString(),
          response_message: response_message || 'Thank you for your interest, but I cannot take on new mentees at this time.'
        })
        .eq('id', mentorshipId);

      if (updateError) throw updateError;

      res.json({
        success: true,
        data: {
          status: 'declined',
          message: 'Mentorship request has been declined'
        }
      });
    }
  } catch (error) {
    console.error('Respond to mentorship error:', error);
    res.status(500).json({ success: false, error: 'Failed to respond to mentorship request' });
  }
});

/**
 * Get mentorship relationships (as mentor or mentee)
 * GET /api/mentorship
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { role = 'all', status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Build query based on role
    let query = supabase
      .from('mentorships')
      .select(`
        *,
        mentor:users!mentor_id(
          id,
          username,
          level,
          experience
        ),
        mentee:users!mentee_id(
          id,
          username,
          level,
          experience
        )
      `);

    if (role === 'mentor') {
      query = query.eq('mentor_id', userId);
    } else if (role === 'mentee') {
      query = query.eq('mentee_id', userId);
    } else {
      query = query.or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: mentorships, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    // Process mentorships to show user's perspective
    const processedMentorships = mentorships?.map(mentorship => {
      const isMentor = mentorship.mentor_id === userId;
      return {
        ...mentorship,
        user_role: isMentor ? 'mentor' : 'mentee',
        partner: isMentor ? mentorship.mentee : mentorship.mentor
      };
    }) || [];

    res.json({
      success: true,
      data: {
        mentorships: processedMentorships,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get mentorships error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mentorships' });
  }
});

/**
 * Find potential mentors
 * GET /api/mentorship/find-mentors
 */
router.get('/find-mentors', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { skill_area, min_level = 1, max_mentees = 5, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get current user's level
    const { data: currentUser } = await supabase
      .from('users')
      .select('level')
      .eq('id', userId)
      .single();

    // Find potential mentors (users with higher level who aren't at max mentees)
    let query = supabase
      .from('users')
      .select(`
        id,
        username,
        level,
        experience,
        created_at
      `)
      .neq('id', userId)
      .gte('level', Math.max(Number(min_level), (currentUser?.level || 1) + 1));

    const { data: potentialMentors, error } = await query
      .order('level', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) throw error;

    // Filter out mentors who already have max mentees or existing relationships
    const mentorIds = potentialMentors?.map(m => m.id) || [];
    
    if (mentorIds.length > 0) {
      // Get mentee counts for each potential mentor
      const { data: menteeCounts } = await supabase
        .from('mentorships')
        .select('mentor_id')
        .in('mentor_id', mentorIds)
        .eq('status', 'active');

      // Get existing relationships
      const { data: existingRelationships } = await supabase
        .from('mentorships')
        .select('mentor_id')
        .in('mentor_id', mentorIds)
        .eq('mentee_id', userId)
        .in('status', ['pending', 'active']);

      const menteeCountMap = (menteeCounts || []).reduce((acc, item) => {
        acc[item.mentor_id] = (acc[item.mentor_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const existingMentorIds = new Set((existingRelationships || []).map(r => r.mentor_id));

      // Filter available mentors
      const availableMentors = potentialMentors?.filter(mentor => {
        const menteeCount = menteeCountMap[mentor.id] || 0;
        return menteeCount < Number(max_mentees) && !existingMentorIds.has(mentor.id);
      }).map(mentor => ({
        ...mentor,
        current_mentees: menteeCountMap[mentor.id] || 0,
        max_mentees: Number(max_mentees)
      })) || [];

      res.json({
        success: true,
        data: {
          mentors: availableMentors,
          pagination: {
            page: Number(page),
            limit: Number(limit)
          }
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          mentors: [],
          pagination: {
            page: Number(page),
            limit: Number(limit)
          }
        }
      });
    }
  } catch (error) {
    console.error('Find mentors error:', error);
    res.status(500).json({ success: false, error: 'Failed to find mentors' });
  }
});

/**
 * Add milestone to mentorship
 * POST /api/mentorship/:id/milestone
 */
router.post('/:id/milestone', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: mentorshipId } = req.params;
    const { title, description, target_date, reward_xp = 0 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!title) {
      res.status(400).json({ success: false, error: 'Milestone title is required' });
      return;
    }

    // Get mentorship details
    const { data: mentorship, error: mentorshipError } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', mentorshipId)
      .eq('status', 'active')
      .single();

    if (mentorshipError || !mentorship) {
      res.status(404).json({ success: false, error: 'Active mentorship not found' });
      return;
    }

    // Check if user is the mentor
    if (mentorship.mentor_id !== userId) {
      res.status(403).json({ 
        success: false, 
        error: 'Only the mentor can add milestones' 
      });
      return;
    }

    // Add milestone to progress
    const currentProgress = mentorship.progress || { milestones: [] };
    const newMilestone = {
      id: Date.now().toString(),
      title,
      description: description || '',
      target_date: target_date || null,
      reward_xp: Number(reward_xp),
      completed: false,
      created_at: new Date().toISOString()
    };

    const updatedProgress = {
      ...currentProgress,
      milestones: [...(currentProgress.milestones || []), newMilestone]
    };

    // Update mentorship with new milestone
    const { error: updateError } = await supabase
      .from('mentorships')
      .update({ progress: updatedProgress })
      .eq('id', mentorshipId);

    if (updateError) throw updateError;

    res.status(201).json({
      success: true,
      data: {
        milestone: newMilestone,
        message: 'Milestone added successfully!'
      }
    });
  } catch (error) {
    console.error('Add milestone error:', error);
    res.status(500).json({ success: false, error: 'Failed to add milestone' });
  }
});

/**
 * Complete milestone
 * PUT /api/mentorship/:id/milestone/:milestoneId/complete
 */
router.put('/:id/milestone/:milestoneId/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: mentorshipId, milestoneId } = req.params;
    const { notes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get mentorship details
    const { data: mentorship, error: mentorshipError } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', mentorshipId)
      .eq('status', 'active')
      .single();

    if (mentorshipError || !mentorship) {
      res.status(404).json({ success: false, error: 'Active mentorship not found' });
      return;
    }

    // Check if user is the mentor or mentee
    if (mentorship.mentor_id !== userId && mentorship.mentee_id !== userId) {
      res.status(403).json({ 
        success: false, 
        error: 'Only the mentor or mentee can complete milestones' 
      });
      return;
    }

    const currentProgress = mentorship.progress || { milestones: [] };
    const milestones = currentProgress.milestones || [];
    
    // Find and update the milestone
    const milestoneIndex = milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) {
      res.status(404).json({ success: false, error: 'Milestone not found' });
      return;
    }

    if (milestones[milestoneIndex].completed) {
      res.status(400).json({ success: false, error: 'Milestone already completed' });
      return;
    }

    // Mark milestone as completed
    milestones[milestoneIndex] = {
      ...milestones[milestoneIndex],
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: userId,
      completion_notes: notes || ''
    };

    const updatedProgress = {
      ...currentProgress,
      milestones,
      milestones_completed: (currentProgress.milestones_completed || 0) + 1
    };

    // Update mentorship
    const { error: updateError } = await supabase
      .from('mentorships')
      .update({ progress: updatedProgress })
      .eq('id', mentorshipId);

    if (updateError) throw updateError;

    // Award XP to mentee if specified
    const rewardXp = milestones[milestoneIndex].reward_xp || 0;
    if (rewardXp > 0) {
      try {
        // Get current user experience
        const { data: menteeData } = await supabase
          .from('users')
          .select('experience')
          .eq('id', mentorship.mentee_id)
          .single();
        
        if (menteeData) {
          await supabase
            .from('users')
            .update({ 
              experience: (menteeData.experience || 0) + rewardXp 
            })
            .eq('id', mentorship.mentee_id);
        }
      } catch {
        // Ignore XP update errors
      }
    }

    res.json({
      success: true,
      data: {
        milestone: milestones[milestoneIndex],
        xp_awarded: rewardXp,
        message: `Milestone completed! ${rewardXp > 0 ? `Awarded ${rewardXp} XP.` : ''}`
      }
    });
  } catch (error) {
    console.error('Complete milestone error:', error);
    res.status(500).json({ success: false, error: 'Failed to complete milestone' });
  }
});

/**
 * End mentorship
 * PUT /api/mentorship/:id/end
 */
router.put('/:id/end', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: mentorshipId } = req.params;
    const { reason, feedback } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get mentorship details
    const { data: mentorship, error: mentorshipError } = await supabase
      .from('mentorships')
      .select('*')
      .eq('id', mentorshipId)
      .eq('status', 'active')
      .single();

    if (mentorshipError || !mentorship) {
      res.status(404).json({ success: false, error: 'Active mentorship not found' });
      return;
    }

    // Check if user is the mentor or mentee
    if (mentorship.mentor_id !== userId && mentorship.mentee_id !== userId) {
      res.status(403).json({ 
        success: false, 
        error: 'Only the mentor or mentee can end the mentorship' 
      });
      return;
    }

    // End the mentorship
    const { error: updateError } = await supabase
      .from('mentorships')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        ended_by: userId,
        end_reason: reason || 'Mentorship completed',
        final_feedback: feedback || ''
      })
      .eq('id', mentorshipId);

    if (updateError) throw updateError;

    res.json({
      success: true,
      data: {
        status: 'completed',
        message: 'Mentorship has been ended successfully'
      }
    });
  } catch (error) {
    console.error('End mentorship error:', error);
    res.status(500).json({ success: false, error: 'Failed to end mentorship' });
  }
});

export default router;