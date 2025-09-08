'use client';
import * as React from 'react';
import { useCard } from './context';
import type { CardHeaderProps } from '../types';
import { cn } from '../../../../lib/utils';

const padMap = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' };

const borderSide = (dir: 'top' | 'bottom') =>
  dir === 'top' ? 'border-t' : 'border-b';

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, disablePadding, divider, children, ...rest }, ref) => {
    const { padding } = useCard();

    const hasTop = divider === 'top' || divider === true;
    const hasBottom = divider === 'bottom' || divider === true;

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-1.5',
          disablePadding ? 'p-0' : padMap[padding],
          hasTop && 'border-gray-200 ' + borderSide('top'),
          hasBottom && 'border-gray-200 ' + borderSide('bottom'),
          className
        )}
        {...rest}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';
