'use client';

import * as React from 'react';
import { cn } from '../../../../lib/utils';
import { useCard } from './context';
import type { CardMediaProps } from '../types';

const padMap = { none: 'p-0', sm: 'p-3', md: 'p-4', lg: 'p-6' } as const;

function paddingTopForRatio(
  ratio: NonNullable<CardMediaProps['ratio']>
): string | null {
  if (ratio === 'auto') return null;
  if (typeof ratio === 'number') {
    return `${(1 / ratio) * 100}%`;
  }
  const [w, h] = ratio.split(':').map(Number);
  if (!w || !h) return null;
  return `${(h / w) * 100}%`;
}

function fitClass(fit: NonNullable<CardMediaProps['fit']>) {
  switch (fit) {
    case 'contain':
      return 'object-contain';
    case 'fill':
      return 'object-fill';
    case 'none':
      return 'object-none';
    case 'scale-down':
      return 'object-scale-down';
    case 'cover':
    default:
      return 'object-cover';
  }
}

export const CardMedia = React.forwardRef<HTMLDivElement, CardMediaProps>(
  (
    {
      className,
      disablePadding,
      ratio = 'auto',
      bleed = false,
      rounded = 'top',
      fit = 'cover',
      component = 'img',
      src,
      alt,
      loading = 'lazy',
      height,
      width,
      poster,
      controls,
      autoPlay,
      loop,
      muted,
      playsInline,
      children,
      ...rest // spread only to outer wrapper
    },
    ref
  ) => {
    const { padding } = useCard();

    const pad = disablePadding ? 'p-0' : padMap[padding];

    // Round only the edges that touch the card boundary
    const roundCls =
      rounded === true
        ? 'rounded-[var(--card-radius)]'
        : rounded === 'top'
        ? 'rounded-t-[var(--card-radius)]'
        : rounded === 'bottom'
        ? 'rounded-b-[var(--card-radius)]'
        : rounded === 'left'
        ? 'rounded-l-[var(--card-radius)]'
        : rounded === 'right'
        ? 'rounded-r-[var(--card-radius)]'
        : 'rounded-none';

    // If bleeding, force no outer padding
    const outerPad = bleed ? 'p-0' : pad;

    const spacerPt = ratio ? paddingTopForRatio(ratio) : null;
    const isAuto = ratio === 'auto' || !spacerPt;

    const commonMediaClass = cn('w-full', fitClass(fit));

    return (
      <div
        ref={ref}
        className={cn(outerPad, className)}
        {...rest}
      >
        <div className={cn('relative w-full overflow-hidden', roundCls)}>
          {isAuto ? (
            // Natural height flow (no absolute positioning)
            <>
              {component === 'img' && (
                <img
                  src={src}
                  alt={alt ?? ''}
                  loading={loading}
                  height={height as any}
                  width={width as any}
                  className={commonMediaClass}
                />
              )}
              {component === 'video' && (
                <video
                  src={src}
                  poster={poster}
                  controls={controls}
                  autoPlay={autoPlay}
                  loop={loop}
                  muted={muted}
                  playsInline={playsInline}
                  className={commonMediaClass}
                />
              )}
              {component === 'iframe' && (
                <iframe
                  src={src}
                  title={alt ?? 'media'}
                  loading={loading as any}
                  className={commonMediaClass}
                />
              )}
              {typeof component !== 'string' && component && (
                <div className={commonMediaClass}>
                  {React.createElement(component as any, { src, alt, poster })}
                </div>
              )}
              {children}
            </>
          ) : (
            // Fixed aspect ratio box
            <>
              <div
                style={{ paddingTop: spacerPt }}
                aria-hidden="true"
              />
              {component === 'img' && (
                <img
                  src={src}
                  alt={alt ?? ''}
                  loading={loading}
                  height={height as any}
                  width={width as any}
                  className={cn('absolute inset-0 h-full', commonMediaClass)}
                />
              )}
              {component === 'video' && (
                <video
                  src={src}
                  poster={poster}
                  controls={controls}
                  autoPlay={autoPlay}
                  loop={loop}
                  muted={muted}
                  playsInline={playsInline}
                  className={cn('absolute inset-0 h-full', commonMediaClass)}
                />
              )}
              {component === 'iframe' && (
                <iframe
                  src={src}
                  title={alt ?? 'media'}
                  loading={loading as any}
                  className={cn('absolute inset-0 h-full', commonMediaClass)}
                />
              )}
              {typeof component !== 'string' && component && (
                <div
                  className={cn('absolute inset-0 h-full', commonMediaClass)}
                >
                  {React.createElement(component as any, { src, alt, poster })}
                </div>
              )}
              {children}
            </>
          )}
        </div>
      </div>
    );
  }
);

CardMedia.displayName = 'CardMedia';
