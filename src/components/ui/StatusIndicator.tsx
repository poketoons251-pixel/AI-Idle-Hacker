import React from 'react';
import { Wifi, WifiOff, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';

type StatusType = 'online' | 'offline' | 'away' | 'busy' | 'syncing' | 'connected' | 'disconnected' | 'active' | 'idle' | 'error';

interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  pulse?: boolean;
}

const statusConfig = {
  online: {
    color: 'bg-green-500 text-green-400 border-green-500',
    icon: CheckCircle,
    label: 'Online'
  },
  offline: {
    color: 'bg-gray-500 text-gray-400 border-gray-500',
    icon: WifiOff,
    label: 'Offline'
  },
  away: {
    color: 'bg-yellow-500 text-yellow-400 border-yellow-500',
    icon: Clock,
    label: 'Away'
  },
  busy: {
    color: 'bg-red-500 text-red-400 border-red-500',
    icon: AlertCircle,
    label: 'Busy'
  },
  syncing: {
    color: 'bg-blue-500 text-blue-400 border-blue-500',
    icon: Zap,
    label: 'Syncing'
  },
  connected: {
    color: 'bg-green-500 text-green-400 border-green-500',
    icon: Wifi,
    label: 'Connected'
  },
  disconnected: {
    color: 'bg-red-500 text-red-400 border-red-500',
    icon: WifiOff,
    label: 'Disconnected'
  },
  active: {
    color: 'bg-cyber-accent text-cyber-accent border-cyber-accent',
    icon: Zap,
    label: 'Active'
  },
  idle: {
    color: 'bg-cyber-primary/50 text-cyber-primary border-cyber-primary',
    icon: Clock,
    label: 'Idle'
  },
  error: {
    color: 'bg-red-500 text-red-400 border-red-500',
    icon: AlertCircle,
    label: 'Error'
  }
};

const sizeConfig = {
  sm: {
    dot: 'w-2 h-2',
    icon: 'w-3 h-3',
    text: 'text-xs',
    container: 'space-x-1'
  },
  md: {
    dot: 'w-3 h-3',
    icon: 'w-4 h-4',
    text: 'text-sm',
    container: 'space-x-2'
  },
  lg: {
    dot: 'w-4 h-4',
    icon: 'w-5 h-5',
    text: 'text-base',
    container: 'space-x-2'
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showIcon = false,
  showLabel = true,
  size = 'md',
  className = '',
  pulse = false
}) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;
  const displayLabel = label || config.label;

  return (
    <div className={`flex items-center ${sizeStyles.container} ${className}`}>
      {showIcon ? (
        <Icon className={`${sizeStyles.icon} ${config.color.split(' ')[1]} ${pulse ? 'animate-pulse' : ''}`} />
      ) : (
        <div
          className={`
            ${sizeStyles.dot} rounded-full ${config.color.split(' ')[0]} 
            ${pulse ? 'animate-pulse' : ''}
          `}
        />
      )}
      
      {showLabel && (
        <span className={`font-mono ${sizeStyles.text} ${config.color.split(' ')[1]}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};

// Preset components for common use cases
export const OnlineStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="online" {...props} />
);

export const OfflineStatus: React.FC<Omit<StatusIndicatorProps, 'status'>> = (props) => (
  <StatusIndicator status="offline" {...props} />
);

export const ConnectionStatus: React.FC<{ isConnected: boolean } & Omit<StatusIndicatorProps, 'status'>> = ({ isConnected, ...props }) => (
  <StatusIndicator status={isConnected ? 'connected' : 'disconnected'} {...props} />
);

export const SyncStatus: React.FC<{ isSyncing: boolean } & Omit<StatusIndicatorProps, 'status'>> = ({ isSyncing, ...props }) => (
  <StatusIndicator 
    status={isSyncing ? 'syncing' : 'connected'} 
    pulse={isSyncing}
    {...props} 
  />
);