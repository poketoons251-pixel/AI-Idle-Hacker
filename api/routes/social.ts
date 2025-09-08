/**
 * Social Features API Routes
 * Handle friend requests, messaging, and social interactions
 */
import { Router, type Request, type Response } from 'express';
import { supabase } from '../config/supabase.js';

const router = Router();

/**
 * Send friend request
 * POST /api/social/friends/request
 */
router.post('/friends/request', async (req: Request, res: Response): Promise<void> => {
  try {
    const { friend_username } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!friend_username) {
      res.status(400).json({ success: false, error: 'Friend username is required' });
      return;
    }

    // Find friend by username
    const { data: friendUser, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', friend_username)
      .single();

    if (userError || !friendUser) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    if (friendUser.id === userId) {
      res.status(400).json({ success: false, error: 'Cannot add yourself as friend' });
      return;
    }

    // Check if friendship already exists
    const { data: existingFriendship } = await supabase
      .from('friendships')
      .select('id, status')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendUser.id}),and(user_id.eq.${friendUser.id},friend_id.eq.${userId})`)
      .single();

    if (existingFriendship) {
      const message = existingFriendship.status === 'accepted' 
        ? 'Already friends with this user'
        : 'Friend request already sent';
      res.status(400).json({ success: false, error: message });
      return;
    }

    // Create friend request
    const { data: friendship, error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendUser.id,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        friendship_id: friendship.id,
        friend_username: friendUser.username,
        status: 'request_sent'
      }
    });
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ success: false, error: 'Failed to send friend request' });
  }
});

/**
 * Accept/reject friend request
 * PUT /api/social/friends/:id/respond
 */
router.put('/friends/:id/respond', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: friendshipId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!['accept', 'reject'].includes(action)) {
      res.status(400).json({ success: false, error: 'Action must be accept or reject' });
      return;
    }

    // Verify friendship exists and user is the recipient
    const { data: friendship, error: friendshipError } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .single();

    if (friendshipError || !friendship) {
      res.status(404).json({ success: false, error: 'Friend request not found' });
      return;
    }

    if (action === 'accept') {
      // Accept friend request
      const { error: updateError } = await supabase
        .from('friendships')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', friendshipId);

      if (updateError) throw updateError;

      res.json({
        success: true,
        data: { status: 'accepted' }
      });
    } else {
      // Reject friend request (delete it)
      const { error: deleteError } = await supabase
        .from('friendships')
        .delete()
        .eq('id', friendshipId);

      if (deleteError) throw deleteError;

      res.json({
        success: true,
        data: { status: 'rejected' }
      });
    }
  } catch (error) {
    console.error('Respond to friend request error:', error);
    res.status(500).json({ success: false, error: 'Failed to respond to friend request' });
  }
});

/**
 * Get user's friends and friend requests
 * GET /api/social/friends
 */
router.get('/friends', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status = 'all' } = req.query;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    let query = supabase
      .from('friendships')
      .select(`
        id,
        status,
        created_at,
        accepted_at,
        user_id,
        friend_id,
        users!user_id (
          id,
          username,
          level,
          avatar_url,
          last_active
        ),
        friend_users:users!friend_id (
          id,
          username,
          level,
          avatar_url,
          last_active
        )
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: friendships, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Process friendships to show the correct friend info
    const processedFriendships = friendships?.map(friendship => {
      const isRequester = friendship.user_id === userId;
      const friendInfo = isRequester ? friendship.friend_users : friendship.users;
      
      return {
        id: friendship.id,
        status: friendship.status,
        created_at: friendship.created_at,
        accepted_at: friendship.accepted_at,
        is_requester: isRequester,
        friend: friendInfo
      };
    }) || [];

    // Separate into different categories
    const friends = processedFriendships.filter(f => f.status === 'accepted');
    const sentRequests = processedFriendships.filter(f => f.status === 'pending' && f.is_requester);
    const receivedRequests = processedFriendships.filter(f => f.status === 'pending' && !f.is_requester);

    res.json({
      success: true,
      data: {
        friends,
        sent_requests: sentRequests,
        received_requests: receivedRequests,
        total_friends: friends.length
      }
    });
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch friends' });
  }
});

/**
 * Remove friend
 * DELETE /api/social/friends/:id
 */
router.delete('/friends/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: friendshipId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Verify friendship exists and user is involved
    const { data: friendship } = await supabase
      .from('friendships')
      .select('*')
      .eq('id', friendshipId)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .single();

    if (!friendship) {
      res.status(404).json({ success: false, error: 'Friendship not found' });
      return;
    }

    // Delete friendship
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) throw error;

    res.json({
      success: true,
      data: { status: 'removed' }
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove friend' });
  }
});

/**
 * Send direct message
 * POST /api/social/messages
 */
router.post('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipient_id, content, message_type = 'text' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!recipient_id || !content) {
      res.status(400).json({ success: false, error: 'Recipient and content are required' });
      return;
    }

    if (content.length > 1000) {
      res.status(400).json({ success: false, error: 'Message too long (max 1000 characters)' });
      return;
    }

    // Verify users are friends
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${userId},friend_id.eq.${recipient_id}),and(user_id.eq.${recipient_id},friend_id.eq.${userId})`)
      .eq('status', 'accepted')
      .single();

    if (!friendship) {
      res.status(403).json({ success: false, error: 'Can only message friends' });
      return;
    }

    // Create message (using a hypothetical direct_messages table)
    // Note: This table would need to be added to the database schema
    const { data: message, error } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: userId,
        recipient_id,
        content,
        message_type
      })
      .select(`
        *,
        sender:users!sender_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      // If table doesn't exist, return a placeholder response
      if (error.code === '42P01') {
        res.status(501).json({ 
          success: false, 
          error: 'Direct messaging not yet implemented in database' 
        });
        return;
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

/**
 * Get conversation with a friend
 * GET /api/social/messages/:userId
 */
router.get('/messages/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId: friendId } = req.params;
    const userId = req.user?.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Verify users are friends
    const { data: friendship } = await supabase
      .from('friendships')
      .select('id')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .eq('status', 'accepted')
      .single();

    if (!friendship) {
      res.status(403).json({ success: false, error: 'Can only view messages with friends' });
      return;
    }

    // Get messages between users
    const { data: messages, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:users!sender_id (
          id,
          username,
          avatar_url
        )
      `)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      // If table doesn't exist, return empty conversation
      if (error.code === '42P01') {
        res.json({
          success: true,
          data: {
            messages: [],
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
        messages: messages?.reverse() || [], // Reverse to show oldest first
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

/**
 * Get user's activity feed
 * GET /api/social/activity
 */
router.get('/activity', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    // Get user's friends for activity filtering
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    const friendIds = friendships?.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    ) || [];

    // For now, return a placeholder activity feed
    // In a real implementation, this would aggregate various user activities
    const activities = [
      {
        id: '1',
        type: 'level_up',
        user_id: friendIds[0] || userId,
        content: 'reached level 25!',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        type: 'companion_evolved',
        user_id: friendIds[1] || userId,
        content: 'evolved their AI companion to Epic rarity!',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity feed error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch activity feed' });
  }
});

export default router;