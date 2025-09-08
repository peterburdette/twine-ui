'use client';

import * as React from 'react';
import { cn } from '../../../../lib/utils';
import { useCard } from './context';
import type { CardActionsProps } from '../types';

const gapMap = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
} as const;

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const;

const padMap = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const;

export const CardActions = React.forwardRef<HTMLDivElement, CardActionsProps>(
  (
    {
      className,
      children,
      disablePadding,
      divider,
      justify = 'end',
      spacing = 'md',
      wrap = false,
      ...rest
    },
    ref
  ) => {
    const { padding } = useCard();
    const pad = disablePadding ? 'p-0' : padMap[padding];

    return (
      <footer
        ref={ref}
        className={cn(
          pad,
          divider === true || divider === 'top'
            ? 'border-t border-gray-200'
            : '',
          divider === true || divider === 'bottom'
            ? 'border-b border-gray-200'
            : '',
          'flex',
          wrap ? 'flex-wrap' : 'flex-nowrap',
          gapMap[spacing],
          justifyMap[justify],
          className
        )}
        {...rest}
      >
        {children}
      </footer>
    );
  }
);

CardActions.displayName = 'CardActions';
