import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

const notificationIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const notificationColors = {
  success: 'text-cyber-primary border-cyber-primary bg-cyber-primary/10',
  error: 'text-cyber-danger border-cyber-danger bg-cyber-danger/10',
  info: 'text-cyber-accent border-cyber-accent bg-cyber-accent/10',
  warning: 'text-cyber-warning border-cyber-warning bg-cyber-warning/10',
};

export const NotificationSystem: React.FC = () => {
  const { notifications, removeNotification } = useGameStore();

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        const Icon = notificationIcons[notification.type];
        const colorClass = notificationColors[notification.type];

        return (
          <div
            key={notification.id}
            className={`
              flex items-center space-x-3 p-4 rounded-lg border backdrop-blur-sm
              ${colorClass}
              animate-in slide-in-from-right duration-300
              max-w-sm shadow-lg
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="font-mono text-sm flex-1">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};