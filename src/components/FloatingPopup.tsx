import React from 'react';

interface FloatingPopupProps {
  value: number;
  color: string;
}

export const FloatingPopup: React.FC<FloatingPopupProps> = ({ value, color }) => {
  if (value === null || value === undefined) return null;

  const colorClasses: Record<string, string> = {
    green: 'text-cyber-accent',
    pink: 'text-cyber-primary',
    cyan: 'text-cyber-secondary',
  };

  return (
    <span className={`absolute -top-4 right-0 font-mono text-sm font-bold animate-float-up ${colorClasses[color] || 'text-cyber-accent'}`}>
      +{value.toLocaleString()}
    </span>
  );
};
