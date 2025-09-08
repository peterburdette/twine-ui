'use client';

import * as React from 'react';
import { CardContext } from './_components/context';
import type { CardProps, CardTone } from './types';
import { cn } from './../../../lib/utils';

const densityText: Record<'compact' | 'standard' | 'comfortable', string> = {
  compact: 'text-sm',
  standard: 'text-base',
  comfortable: 'text-base',
};

const baseRadius: Record<NonNullable<CardProps['radius']>, string> = {
  none: 'rounded-none',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
};

// Tailwind default radii in rem (shared via CSS var)
const radiusValue: Record<NonNullable<CardProps['radius']>, string> = {
  none: '0rem',
  sm: '0.125rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
};

const toneSurface: Record<CardTone, string> = {
  default: 'bg-white text-gray-950',
  info: 'bg-blue-50 text-gray-950',
  success: 'bg-green-50 text-gray-950',
  warning: 'bg-yellow-50 text-gray-950',
  danger: 'bg-red-50 text-gray-950',
};

const toneBorder: Record<CardTone, string> = {
  default: 'border-gray-200',
  info: 'border-blue-200',
  success: 'border-green-200',
  warning: 'border-yellow-200',
  danger: 'border-red-200',
};

const elevationClass: Record<NonNullable<CardProps['elevation']>, string> = {
  0: 'shadow-none',
  1: 'shadow-sm',
  2: 'shadow',
  3: 'shadow-md',
  4: 'shadow-lg',
  5: 'shadow-xl',
  6: 'shadow-2xl',
};
const hoverElevationClass: Record<
  NonNullable<CardProps['elevation']>,
  string
> = {
  0: 'hover:shadow-sm',
  1: 'hover:shadow',
  2: 'hover:shadow-md',
  3: 'hover:shadow-lg',
  4: 'hover:shadow-xl',
  5: 'hover:shadow-2xl',
  6: 'hover:shadow-2xl',
};

export const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      as,
      href,
      target,
      rel,
      className,
      children,
      variant = 'elevated',
      tone = 'default',
      density = 'standard',
      orientation = 'vertical',
      padding = 'md',
      radius = 'lg',
      clipContent = true,
      interactive,
      disabled = false,
      shadowOnHover = true,
      border = true,
      elevation = 1,
      onClick,
      ...rest
    },
    ref
  ) => {
    const Comp: any = as ?? (href ? 'a' : onClick ? 'button' : 'div');

    // Treat variant="default" as "elevated"
    const normalizedVariant: 'surface' | 'elevated' =
      (variant as any) === 'default'
        ? 'elevated'
        : (variant as 'surface' | 'elevated');

    const isInteractive = !!interactive || !!href || !!onClick;
    const pointer = disabled ? 'pointer-events-none opacity-60' : '';
    const focusRing =
      isInteractive && !disabled
        ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
        : '';

    const orientationCls =
      orientation === 'horizontal' ? 'flex flex-row' : 'flex flex-col';

    const surfaceCls = cn(
      toneSurface[tone],
      border ? cn('border', toneBorder[tone]) : 'border-0'
    );

    const isElevated = normalizedVariant === 'elevated';
    const elevationCls = isElevated ? elevationClass[elevation] : 'shadow-none';
    const hoverCls =
      isInteractive && isElevated && shadowOnHover && !disabled
        ? hoverElevationClass[elevation]
        : '';

    return (
      <CardContext.Provider value={{ density, padding, orientation, disabled }}>
        <Comp
          ref={ref}
          href={href}
          target={href ? target : undefined}
          rel={href ? rel : undefined}
          type={Comp === 'button' ? 'button' : undefined}
          style={
            {
              ['--card-radius' as any]: radiusValue[radius],
            } as React.CSSProperties
          }
          className={cn(
            baseRadius[radius],
            clipContent && 'overflow-hidden',
            densityText[density],
            surfaceCls,
            elevationCls,
            hoverCls,
            focusRing,
            pointer,
            orientationCls,
            className
          )}
          {...rest}
        >
          {children}
        </Comp>
      </CardContext.Provider>
    );
  }
);

Card.displayName = 'Card';
