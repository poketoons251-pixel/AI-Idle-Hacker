import { useGameStore } from '../store/gameStore';

type WebSocketEventType = 
  | 'guild_chat'
  | 'guild_member_joined'
  | 'guild_member_left'
  | 'guild_war_started'
  | 'guild_war_ended'
  | 'friend_online'
  | 'friend_offline'
  | 'message_received'
  | 'notification'
  | 'sync_update';

interface WebSocketMessage {
  type: WebSocketEventType;
  data: any;
  timestamp: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private eventHandlers: Map<WebSocketEventType, ((data: any) => void)[]> = new Map();

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    
    try {
      // In a real implementation, this would connect to your WebSocket server
      // For now, we'll simulate WebSocket behavior
      this.simulateWebSocket();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.handleReconnect();
    }
  }

  private simulateWebSocket() {
    // Simulate WebSocket connection for demo purposes
    setTimeout(() => {
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('WebSocket connected (simulated)');
      
      // Simulate periodic events
      this.startSimulatedEvents();
    }, 1000);
  }

  private startSimulatedEvents() {
    // Simulate guild chat messages
    setInterval(() => {
      if (Math.random() > 0.8) {
        this.handleMessage({
          type: 'guild_chat',
          data: {
            id: Date.now().toString(),
            sender: 'CyberNinja',
            message: 'Great job on the last operation!',
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });
      }
    }, 10000);

    // Simulate friend status updates
    setInterval(() => {
      if (Math.random() > 0.9) {
        this.handleMessage({
          type: 'friend_online',
          data: {
            friendId: 'friend_' + Math.floor(Math.random() * 5),
            username: 'CodeMaster' + Math.floor(Math.random() * 100),
            status: 'online'
          },
          timestamp: Date.now()
        });
      }
    }, 15000);

    // Simulate notifications
    setInterval(() => {
      if (Math.random() > 0.85) {
        this.handleMessage({
          type: 'notification',
          data: {
            id: Date.now().toString(),
            title: 'Guild War Alert',
            message: 'Your guild is under attack!',
            type: 'warning'
          },
          timestamp: Date.now()
        });
      }
    }, 20000);
  }

  private handleMessage(message: WebSocketMessage) {
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => handler(message.data));
    }
  }

  private handleReconnect() {
    this.isConnecting = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  public on(eventType: WebSocketEventType, handler: (data: any) => void) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  public off(eventType: WebSocketEventType, handler: (data: any) => void) {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public send(type: WebSocketEventType, data: any) {
    // In a real implementation, this would send data through the WebSocket
    console.log('Sending WebSocket message:', { type, data });
    
    // Simulate sending message
    if (type === 'guild_chat') {
      // Echo back the message as if it was sent successfully
      setTimeout(() => {
        this.handleMessage({
          type: 'guild_chat',
          data: {
            ...data,
            id: Date.now().toString(),
            timestamp: Date.now()
          },
          timestamp: Date.now()
        });
      }, 100);
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventHandlers.clear();
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN || true; // Simulated as always connected
  }
}

// Singleton instance
export const websocketService = new WebSocketService();

// React hook for using WebSocket in components
export const useWebSocket = () => {
  return {
    isConnected: websocketService.isConnected(),
    on: websocketService.on.bind(websocketService),
    off: websocketService.off.bind(websocketService),
    send: websocketService.send.bind(websocketService)
  };
};