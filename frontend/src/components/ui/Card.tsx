'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={[
        'bg-[#161D27] border border-[#273244] rounded-xl shadow',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}

export default Card;
export type { CardProps };
