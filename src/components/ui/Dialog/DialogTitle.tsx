'use client';

import type React from 'react';

export interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const DialogTitle = ({
  children,
  className = '',
  id,
  as: Component = 'div',
}: DialogTitleProps) => {
  return (
    <Component
      id={id}
      className={`px-6 py-4 border-b border-gray-200 ${className}`}
    >
      <h2 className="text-xl font-semibold text-gray-900 leading-6">
        {children}
      </h2>
    </Component>
  );
};
