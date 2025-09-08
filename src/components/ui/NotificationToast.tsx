import React, { useEffect, useState } from 'react';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface NotificationToastProps {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: (id: string) => void;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const colorMap = {
  success: 'border-green-500 bg-green-500/10 text-green-400',
  error: 'border-red-500 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
  info: 'border-blue-500 bg-blue-500/10 text-blue-400'
};

export const NotificationToast: React.FC<NotificationToastProps> = ({
  id,
  title,
  message,
  type,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const Icon = iconMap[type];

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  return (
    <div
      className={`
        fixed right-4 z-50 w-80 p-4 rounded-lg border backdrop-blur-sm
        transition-all duration-300 ease-out
        ${colorMap[type]}
        ${
          isVisible && !isExiting
            ? 'translate-x-0 opacity-100'
            : 'translate-x-full opacity-0'
        }
      `}
      style={{
        top: `${4 + (parseInt(id.split('_')[1]) || 0) * 90}rem`
      }}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-mono font-semibold text-sm mb-1">
            {title}
          </h4>
          <p className="font-mono text-xs opacity-90 leading-relaxed">
            {message}
          </p>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-lg overflow-hidden">
        <div
          className="h-full bg-current opacity-50 transition-all ease-linear"
          style={{
            width: isVisible ? '0%' : '100%',
            transitionDuration: `${duration}ms`
          }}
        />
      </div>
    </div>
  );
};