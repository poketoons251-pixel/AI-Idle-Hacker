import React from 'react';

interface AnimatedCounterProps {
  value: number | string;
  isFlashing: boolean;
  flashColor: string;
  className?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  isFlashing,
  flashColor,
  className = '',
}) => (
  <span className={`${className} ${isFlashing ? `animate-flash-${flashColor}` : ''}`}>
    {typeof value === 'number' ? value.toLocaleString() : value}
  </span>
);
