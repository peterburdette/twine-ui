'use client';
import * as React from 'react';
import { cn } from '../../../../lib/utils';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-semibold leading-tight tracking-tight',
      className
    )}
    {...props}
  />
));

CardTitle.displayName = 'CardTitle';
