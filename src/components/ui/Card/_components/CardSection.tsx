'use client';
import * as React from 'react';
import { useCard } from './context';
import type { CardSectionProps } from './../types';
import { cn } from '../../../../lib/utils';
import { CardHeader } from './CardHeader';
import { CardTitle } from './CardTitle';
import { CardDescription } from './CardDescription';
import { CardContent } from './CardContent';

const padMap = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' };

export const CardSection = React.forwardRef<HTMLElement, CardSectionProps>(
  (
    { className, disablePadding, divider, title, subtitle, children, ...rest },
    ref
  ) => {
    const { padding } = useCard();
    const hasTop = divider === 'top' || divider === true;
    const hasBottom = divider === 'bottom' || divider === true;

    return (
      <section
        ref={ref}
        className={cn(
          disablePadding ? 'p-0' : padMap[padding],
          hasTop && 'border-t border-gray-200',
          hasBottom && 'border-b border-gray-200',
          className
        )}
        {...rest}
      >
        {(title || subtitle) && (
          <CardHeader disablePadding>
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </CardHeader>
        )}
        <CardContent disablePadding>{children}</CardContent>
      </section>
    );
  }
);

CardSection.displayName = 'CardSection';
