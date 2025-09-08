'use client';
import * as React from 'react';
import type { CardDividerProps } from './../types';
import { cn } from '../../../../lib/utils';
import { useCard } from './context';

export const CardDivider = React.forwardRef<HTMLHRElement, CardDividerProps>(
  ({ className, inset = false, ...rest }, ref) => {
    const { padding } = useCard();
    const insetCls = inset
      ? padding === 'lg'
        ? 'mx-6'
        : padding === 'md'
        ? 'mx-4'
        : padding === 'sm'
        ? 'mx-3'
        : 'mx-0'
      : 'mx-0';

    return (
      <hr
        ref={ref}
        className={cn('border-0 border-t border-gray-200', insetCls, className)}
        {...rest}
      />
    );
  }
);

CardDivider.displayName = 'CardDivider';
