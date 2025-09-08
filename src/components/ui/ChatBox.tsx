import React, { useState, useRef, useEffect } from 'react';
import { Send, Users, Settings } from 'lucide-react';
import { useWebSocket } from '../../services/websocketService';

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: number;
  type?: 'system' | 'user';
}

interface ChatBoxProps {
  title: string;
  placeholder?: string;
  onSendMessage?: (message: string) => void;
  className?: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  title,
  placeholder = "Type your message...",
  onSendMessage,
  className = ""
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'System',
      message: 'Welcome to the guild chat! Stay connected with your team.',
      timestamp: Date.now() - 300000,
      type: 'system'
    },
    {
      id: '2',
      sender: 'CyberNinja',
      message: 'Ready for the next operation!',
      timestamp: Date.now() - 120000
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isConnected, on, off, send } = useWebSocket();

  useEffect(() => {
    const handleNewMessage = (data: ChatMessage) => {
      setMessages(prev => [...prev, data]);
    };

    on('guild_chat', handleNewMessage);

    return () => {
      off('guild_chat', handleNewMessage);
    };
  }, [on, off]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      message: newMessage.trim(),
      timestamp: Date.now()
    };

    // Add to local messages immediately
    setMessages(prev => [...prev, message]);
    
    // Send through WebSocket
    send('guild_chat', message);
    
    // Call external handler if provided
    onSendMessage?.(newMessage.trim());
    
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMessageAge = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`cyber-card flex flex-col h-96 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cyber-primary/20">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-cyber-accent" />
          <h3 className="font-mono font-semibold text-cyber-primary">{title}</h3>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        <button className="p-2 rounded hover:bg-cyber-primary/10 transition-colors">
          <Settings className="w-4 h-4 text-cyber-primary/70" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col space-y-1 ${
              message.sender === 'You' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center space-x-2 text-xs text-cyber-primary/60">
              {message.sender !== 'You' && (
                <span className="font-mono font-semibold">{message.sender}</span>
              )}
              <span>{getMessageAge(message.timestamp)}</span>
            </div>
            
            <div
              className={`
                max-w-xs px-3 py-2 rounded-lg font-mono text-sm
                ${
                  message.type === 'system'
                    ? 'bg-cyber-primary/10 text-cyber-primary/70 border border-cyber-primary/20'
                    : message.sender === 'You'
                    ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30'
                    : 'bg-cyber-secondary/20 text-cyber-primary border border-cyber-primary/20'
                }
              `}
            >
              {message.message}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-center space-x-2 text-cyber-primary/60">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cyber-primary/40 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-cyber-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-cyber-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <span className="text-xs font-mono">Someone is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-cyber-primary/20">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="
              flex-1 px-3 py-2 bg-cyber-dark/50 border border-cyber-primary/30 
              rounded-lg text-cyber-primary placeholder-cyber-primary/50 
              focus:outline-none focus:border-cyber-accent font-mono text-sm
            "
            disabled={!isConnected}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="
              px-4 py-2 bg-cyber-accent/20 border border-cyber-accent/30 
              rounded-lg text-cyber-accent hover:bg-cyber-accent/30 
              disabled:opacity-50 disabled:cursor-not-allowed 
              transition-colors font-mono text-sm
            "
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {!isConnected && (
          <p className="text-xs text-red-400 mt-2 font-mono">
            Disconnected - Attempting to reconnect...
          </p>
        )}
      </div>
    </div>
  );
};