'use client';

import * as React from 'react';
import { cn } from '../../../../lib/utils';
import { useCard } from './context';
import type { CardContentProps } from '../types';

const padMap = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const;

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, disablePadding, divider, children, ...rest }, ref) => {
    const { padding } = useCard();

    const hasTop = divider === 'top' || divider === true;
    const hasBottom = divider === 'bottom' || divider === true;

    return (
      <div
        ref={ref}
        className={cn(
          disablePadding ? 'p-0' : padMap[padding],
          hasTop && 'border-t border-gray-200',
          hasBottom && 'border-b border-gray-200',
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';
