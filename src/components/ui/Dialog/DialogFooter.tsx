'use client';

import type React from 'react';

export interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const DialogFooter = ({
  children,
  className = '',
  as: Component = 'div',
}: DialogFooterProps) => {
  return (
    <Component
      className={`px-6 py-4 flex justify-end gap-2 border-t border-gray-200 flex-shrink-0 ${className}`}
    >
      {children}
    </Component>
  );
};
