/**
 * WebSocket Server for Real-time Communication
 * Handles guild chat, live updates, friend status, and companion activities
 */
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { supabase } from './config/supabase.js';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  username?: string;
  guildId?: string;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: string;
}

interface GuildChatMessage {
  id: string;
  guild_id: string;
  user_id: string;
  username: string;
  content: string;
  message_type: 'text' | 'system' | 'announcement';
  created_at: string;
}

class GameWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket> = new Map();
  private guildRooms: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
    this.startHeartbeat();
    console.log(`WebSocket server started on port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      console.log('New WebSocket connection');
      
      ws.isAlive = true;
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          console.error('WebSocket message error:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnection(ws);
      });

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connection_established',
        data: { message: 'Connected to AI Idle Hacker WebSocket server' }
      });
    });
  }

  private async handleMessage(ws: AuthenticatedWebSocket, message: WebSocketMessage): Promise<void> {
    switch (message.type) {
      case 'authenticate':
        await this.handleAuthentication(ws, message.data);
        break;
      
      case 'join_guild_chat':
        await this.handleJoinGuildChat(ws, message.data);
        break;
      
      case 'leave_guild_chat':
        this.handleLeaveGuildChat(ws, message.data);
        break;
      
      case 'guild_chat_message':
        await this.handleGuildChatMessage(ws, message.data);
        break;
      
      case 'friend_status_update':
        await this.handleFriendStatusUpdate(ws, message.data);
        break;
      
      case 'companion_activity':
        await this.handleCompanionActivity(ws, message.data);
        break;
      
      case 'ping':
        this.sendMessage(ws, { type: 'pong', data: { timestamp: new Date().toISOString() } });
        break;
      
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private async handleAuthentication(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    try {
      const { token } = data;
      
      if (!token) {
        this.sendError(ws, 'Authentication token required');
        return;
      }

      // Verify JWT token (assuming JWT_SECRET is available)
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Get user data from Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('id, username, level, avatar_url')
        .eq('id', decoded.userId)
        .single();

      if (error || !user) {
        this.sendError(ws, 'Invalid authentication token');
        return;
      }

      // Set user info on WebSocket
      ws.userId = user.id;
      ws.username = user.username;
      
      // Store client connection
      this.clients.set(user.id, ws);

      // Get user's guild if they have one
      const { data: guildMember } = await supabase
        .from('guild_members')
        .select('guild_id')
        .eq('user_id', user.id)
        .single();

      if (guildMember) {
        ws.guildId = guildMember.guild_id;
      }

      this.sendMessage(ws, {
        type: 'authenticated',
        data: {
          user: {
            id: user.id,
            username: user.username,
            level: user.level,
            avatar_url: user.avatar_url
          },
          guild_id: ws.guildId || null
        }
      });

      // Notify friends that user is online
      await this.broadcastFriendStatus(user.id, 'online');
      
      console.log(`User ${user.username} authenticated via WebSocket`);
    } catch (error) {
      console.error('Authentication error:', error);
      this.sendError(ws, 'Authentication failed');
    }
  }

  private async handleJoinGuildChat(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!ws.userId || !ws.guildId) {
      this.sendError(ws, 'Authentication required and must be in a guild');
      return;
    }

    // Add user to guild room
    if (!this.guildRooms.has(ws.guildId)) {
      this.guildRooms.set(ws.guildId, new Set());
    }
    this.guildRooms.get(ws.guildId)!.add(ws.userId);

    // Get recent guild chat messages
    const { data: recentMessages } = await supabase
      .from('guild_chat_messages')
      .select(`
        id,
        content,
        message_type,
        created_at,
        user:users!user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('guild_id', ws.guildId)
      .order('created_at', { ascending: false })
      .limit(50);

    this.sendMessage(ws, {
      type: 'guild_chat_joined',
      data: {
        guild_id: ws.guildId,
        recent_messages: recentMessages?.reverse() || []
      }
    });

    // Notify other guild members
    this.broadcastToGuild(ws.guildId, {
      type: 'user_joined_chat',
      data: {
        user_id: ws.userId,
        username: ws.username
      }
    }, ws.userId);
  }

  private handleLeaveGuildChat(ws: AuthenticatedWebSocket, data: any): void {
    if (!ws.userId || !ws.guildId) return;

    // Remove user from guild room
    const guildRoom = this.guildRooms.get(ws.guildId);
    if (guildRoom) {
      guildRoom.delete(ws.userId);
      if (guildRoom.size === 0) {
        this.guildRooms.delete(ws.guildId);
      }
    }

    // Notify other guild members
    this.broadcastToGuild(ws.guildId, {
      type: 'user_left_chat',
      data: {
        user_id: ws.userId,
        username: ws.username
      }
    }, ws.userId);
  }

  private async handleGuildChatMessage(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!ws.userId || !ws.guildId) {
      this.sendError(ws, 'Must be authenticated and in a guild to send messages');
      return;
    }

    const { content, message_type = 'text' } = data;

    if (!content || content.trim().length === 0) {
      this.sendError(ws, 'Message content cannot be empty');
      return;
    }

    if (content.length > 500) {
      this.sendError(ws, 'Message too long (max 500 characters)');
      return;
    }

    try {
      // Save message to database
      const { data: message, error } = await supabase
        .from('guild_chat_messages')
        .insert({
          guild_id: ws.guildId,
          user_id: ws.userId,
          content: content.trim(),
          message_type
        })
        .select(`
          id,
          content,
          message_type,
          created_at,
          user:users!user_id (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Broadcast message to all guild members
      this.broadcastToGuild(ws.guildId, {
        type: 'guild_chat_message',
        data: { message }
      });

    } catch (error) {
      console.error('Guild chat message error:', error);
      this.sendError(ws, 'Failed to send message');
    }
  }

  private async handleFriendStatusUpdate(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!ws.userId) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const { status } = data; // 'online', 'offline', 'away', 'busy'
    
    if (!['online', 'offline', 'away', 'busy'].includes(status)) {
      this.sendError(ws, 'Invalid status');
      return;
    }

    // Update user's status in database
    await supabase
      .from('users')
      .update({ 
        status,
        last_active: new Date().toISOString()
      })
      .eq('id', ws.userId);

    // Broadcast status to friends
    await this.broadcastFriendStatus(ws.userId, status);
  }

  private async handleCompanionActivity(ws: AuthenticatedWebSocket, data: any): Promise<void> {
    if (!ws.userId) {
      this.sendError(ws, 'Authentication required');
      return;
    }

    const { companion_id, activity_type, activity_data } = data;

    // Verify companion belongs to user
    const { data: companion } = await supabase
      .from('ai_companions')
      .select('id, name, rarity')
      .eq('id', companion_id)
      .eq('user_id', ws.userId)
      .single();

    if (!companion) {
      this.sendError(ws, 'Companion not found');
      return;
    }

    // Broadcast companion activity to friends
    const activityMessage = {
      type: 'companion_activity',
      data: {
        user_id: ws.userId,
        username: ws.username,
        companion: {
          id: companion.id,
          name: companion.name,
          rarity: companion.rarity
        },
        activity_type,
        activity_data,
        timestamp: new Date().toISOString()
      }
    };

    await this.broadcastToFriends(ws.userId, activityMessage);
  }

  private async broadcastFriendStatus(userId: string, status: string): Promise<void> {
    // Get user's friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    const friendIds = friendships?.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    ) || [];

    // Send status update to online friends
    const statusMessage = {
      type: 'friend_status_update',
      data: {
        user_id: userId,
        status,
        timestamp: new Date().toISOString()
      }
    };

    friendIds.forEach(friendId => {
      const friendWs = this.clients.get(friendId);
      if (friendWs && friendWs.readyState === WebSocket.OPEN) {
        this.sendMessage(friendWs, statusMessage);
      }
    });
  }

  private async broadcastToFriends(userId: string, message: WebSocketMessage): Promise<void> {
    // Get user's friends
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    const friendIds = friendships?.map(f => 
      f.user_id === userId ? f.friend_id : f.user_id
    ) || [];

    // Send message to online friends
    friendIds.forEach(friendId => {
      const friendWs = this.clients.get(friendId);
      if (friendWs && friendWs.readyState === WebSocket.OPEN) {
        this.sendMessage(friendWs, message);
      }
    });
  }

  private broadcastToGuild(guildId: string, message: WebSocketMessage, excludeUserId?: string): void {
    const guildRoom = this.guildRooms.get(guildId);
    if (!guildRoom) return;

    guildRoom.forEach(userId => {
      if (excludeUserId && userId === excludeUserId) return;
      
      const ws = this.clients.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }

  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: message.timestamp || new Date().toISOString()
      }));
    }
  }

  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error }
    });
  }

  private handleDisconnection(ws: AuthenticatedWebSocket): void {
    if (ws.userId) {
      console.log(`User ${ws.username} disconnected`);
      
      // Remove from clients
      this.clients.delete(ws.userId);
      
      // Remove from guild rooms
      if (ws.guildId) {
        const guildRoom = this.guildRooms.get(ws.guildId);
        if (guildRoom) {
          guildRoom.delete(ws.userId);
          if (guildRoom.size === 0) {
            this.guildRooms.delete(ws.guildId);
          }
        }
      }
      
      // Broadcast offline status to friends
      this.broadcastFriendStatus(ws.userId, 'offline');
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  public broadcast(message: WebSocketMessage): void {
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }

  public getConnectedUsers(): number {
    return this.clients.size;
  }

  public getGuildRooms(): Map<string, Set<string>> {
    return this.guildRooms;
  }

  public close(): void {
    clearInterval(this.heartbeatInterval);
    this.wss.close();
  }
}

// Export singleton instance
let wsServer: GameWebSocketServer | null = null;

export function initializeWebSocketServer(port?: number): GameWebSocketServer {
  if (!wsServer) {
    wsServer = new GameWebSocketServer(port);
  }
  return wsServer;
}

export function getWebSocketServer(): GameWebSocketServer | null {
  return wsServer;
}

export default GameWebSocketServer;