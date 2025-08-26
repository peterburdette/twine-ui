'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  /** Preferred placement; will auto-flip if it overflows. */
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  /** Distance in px between trigger and tooltip */
  offset?: number;
  /** Min viewport padding to keep tooltip away from edges */
  viewportPadding?: number;
}

type Coords = { top: number; left: number };
type Placement = NonNullable<TooltipProps['placement']>;

const Tooltip = ({
  children,
  content,
  placement = 'top',
  delay = 500,
  className = '',
  offset = 8,
  viewportPadding = 8,
}: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<Coords>({ top: 0, left: 0 });
  const [resolvedPlacement, setResolvedPlacement] =
    useState<Placement>(placement);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const roRef = useRef<ResizeObserver | null>(null);

  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const computeCoords = (
    pref: Placement,
    tr: DOMRect,
    tt: DOMRect,
    vw: number,
    vh: number
  ): { pos: Coords; overflow: boolean } => {
    let top = 0;
    let left = 0;

    switch (pref) {
      case 'top':
        top = tr.top - tt.height - offset;
        left = tr.left + (tr.width - tt.width) / 2; // center horizontally
        break;
      case 'bottom':
        top = tr.bottom + offset;
        left = tr.left + (tr.width - tt.width) / 2; // center horizontally
        break;
      case 'left':
        top = tr.top + (tr.height - tt.height) / 2; // center vertically
        left = tr.left - tt.width - offset;
        break;
      case 'right':
        top = tr.top + (tr.height - tt.height) / 2; // center vertically
        left = tr.right + offset;
        break;
    }

    // Check overflow BEFORE clamping (to drive flipping logic)
    const overflow =
      left < viewportPadding ||
      left + tt.width > vw - viewportPadding ||
      top < viewportPadding ||
      top + tt.height > vh - viewportPadding;

    return { pos: { top, left }, overflow };
  };

  const pickPlacement = (
    pref: Placement,
    tr: DOMRect,
    tt: DOMRect,
    vw: number,
    vh: number
  ): { placement: Placement; pos: Coords } => {
    // 1) Try preferred
    let attempt = computeCoords(pref, tr, tt, vw, vh);
    if (!attempt.overflow) return { placement: pref, pos: attempt.pos };

    // 2) Try direct opposite
    const opposite: Record<Placement, Placement> = {
      top: 'bottom',
      bottom: 'top',
      left: 'right',
      right: 'left',
    };
    attempt = computeCoords(opposite[pref], tr, tt, vw, vh);
    if (!attempt.overflow)
      return { placement: opposite[pref], pos: attempt.pos };

    // 3) Choose side with most available space
    const spaceTop = tr.top;
    const spaceBottom = vh - tr.bottom;
    const spaceLeft = tr.left;
    const spaceRight = vw - tr.right;

    const bySpace: Placement[] =
      pref === 'top' || pref === 'bottom'
        ? spaceTop > spaceBottom
          ? ['top', 'bottom']
          : ['bottom', 'top']
        : spaceLeft > spaceRight
        ? ['left', 'right']
        : ['right', 'left'];

    for (const p of bySpace) {
      attempt = computeCoords(p, tr, tt, vw, vh);
      if (!attempt.overflow) return { placement: p, pos: attempt.pos };
    }

    // 4) Fall back to preferred even if overflowing (we’ll clamp next)
    attempt = computeCoords(pref, tr, tt, vw, vh);
    return { placement: pref, pos: attempt.pos };
  };

  const clampToViewport = (
    pos: Coords,
    tt: DOMRect,
    vw: number,
    vh: number
  ): Coords => {
    let { top, left } = pos;
    if (left < viewportPadding) left = viewportPadding;
    if (left + tt.width > vw - viewportPadding)
      left = vw - tt.width - viewportPadding;
    if (top < viewportPadding) top = viewportPadding;
    if (top + tt.height > vh - viewportPadding)
      top = vh - tt.height - viewportPadding;
    return { top, left };
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const tr = triggerRef.current.getBoundingClientRect();
    const tt = tooltipRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Pick best placement + base position
    const { placement: best, pos } = pickPlacement(placement, tr, tt, vw, vh);
    // Clamp to viewport with padding
    const clamped = clampToViewport(pos, tt, vw, vh);

    setResolvedPlacement(best);
    setCoords(clamped);
  };

  // Recompute when shown / placement changes
  useEffect(() => {
    if (!isVisible) return;
    const raf = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, placement, content]);

  // Track scroll/resize while visible
  useEffect(() => {
    if (!isVisible) return;
    const onMove = () => updatePosition();
    window.addEventListener('scroll', onMove, { passive: true });
    window.addEventListener('resize', onMove);
    return () => {
      window.removeEventListener('scroll', onMove);
      window.removeEventListener('resize', onMove);
    };
  }, [isVisible]);

  // Reposition when tooltip content size changes (keeps top/bottom centered)
  useEffect(() => {
    if (!isVisible || !tooltipRef.current) return;
    roRef.current?.disconnect();
    roRef.current = new ResizeObserver(() => updatePosition());
    roRef.current.observe(tooltipRef.current);
    return () => roRef.current?.disconnect();
  }, [isVisible]);

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      roRef.current?.disconnect();
    };
  }, []);

  // Clone child to attach refs/handlers while preserving existing props
  const clonedTrigger = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      children.props.onBlur?.(e);
    },
  });

  return (
    <>
      {clonedTrigger}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`fixed z-50 px-2 py-1 text-sm text-white bg-gray-900 rounded shadow-lg pointer-events-none ${className}`}
          style={{ top: coords.top, left: coords.left }}
          role="tooltip"
        >
          {content}
          <div
            className={`absolute w-2 h-2 bg-gray-900 rotate-45
              ${
                resolvedPlacement === 'top'
                  ? 'bottom-[-4px] left-1/2 -translate-x-1/2'
                  : resolvedPlacement === 'bottom'
                  ? 'top-[-4px] left-1/2 -translate-x-1/2'
                  : resolvedPlacement === 'left'
                  ? 'right-[-4px] top-1/2 -translate-y-1/2'
                  : 'left-[-4px] top-1/2 -translate-y-1/2'
              }`}
          />
        </div>
      )}
    </>
  );
};

export { Tooltip };
export default Tooltip;
