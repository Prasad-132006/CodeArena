'use client';

import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
  size?: SpinnerSize;
  color?: string;
  className?: string;
}

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

export function Spinner({ size = 'md', color = '#FFA116', className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={[
        'inline-block animate-spin rounded-full border-solid border-t-transparent',
        sizeClasses[size],
        className,
      ].join(' ')}
      style={{
        borderColor: `${color}33`,
        borderTopColor: 'transparent',
        borderLeftColor: color,
      }}
    />
  );
}

export default Spinner;
export type { SpinnerProps, SpinnerSize };
