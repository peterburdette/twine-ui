'use client';
import * as React from 'react';
import { useCard } from './context';
import type { CardFooterProps } from './../types';
import { cn } from '../../../../lib/utils';

const padMap = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, disablePadding, divider, children, ...rest }, ref) => {
    const { padding } = useCard();
    const hasTop = divider === 'top' || divider === true;
    const hasBottom = divider === 'bottom' || divider === true;

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
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

CardFooter.displayName = 'CardFooter';
