'use client';

import type React from 'react';
import type { JSX } from 'react/jsx-runtime';

export interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
  dividers?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export const DialogContent = ({
  children,
  className = '',
  dividers = false,
  as: Component = 'div',
}: DialogContentProps) => {
  return (
    <Component
      className={`
        px-6 py-4 overflow-y-auto flex-1
        ${dividers ? 'border-t border-b border-gray-200' : ''}
        ${className}
      `}
    >
      {children}
    </Component>
  );
};
