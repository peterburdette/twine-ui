'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';

export interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  trigger?: 'click' | 'hover';
  placement?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  className?: string;
  contentClassName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover: React.FC<PopoverProps> = ({
  children,
  content,
  trigger = 'click',
  placement = 'bottom',
  offset = 8,
  className = '',
  contentClassName = '',
  open: controlledOpen,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = (open: boolean) => {
    if (!isControlled) setInternalOpen(open);
    onOpenChange?.(open);
  };

  // true if event target is inside trigger/popover or a keep-open portal
  const eventFromInside = (e: Event) => {
    const path = (e as any).composedPath?.() as EventTarget[] | undefined;
    const inAreas = (node: EventTarget) =>
      (contentRef.current &&
        node instanceof Node &&
        contentRef.current.contains(node)) ||
      (triggerRef.current &&
        node instanceof Node &&
        triggerRef.current.contains(node)) ||
      (node instanceof Element &&
        !!node.closest('[data-twine-keepopen="true"]'));

    if (path && path.length) return path.some(inAreas);

    const t = e.target as Node | null;
    return (
      !!t &&
      ((contentRef.current?.contains(t) ?? false) ||
        (triggerRef.current?.contains(t) ?? false) ||
        (t instanceof Element && !!t.closest('[data-twine-keepopen="true"]')))
    );
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 8;

    const spaceBelow = viewportH - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    // flip for top/bottom when there's not enough room
    const shouldFlip =
      (placement === 'bottom' &&
        spaceBelow < contentRect.height &&
        spaceAbove > spaceBelow) ||
      (placement === 'top' &&
        spaceAbove < contentRect.height &&
        spaceBelow > spaceAbove);

    const actualPlacement =
      placement === 'bottom' || placement === 'top'
        ? shouldFlip
          ? placement === 'bottom'
            ? 'top'
            : 'bottom'
          : placement
        : placement;

    let top = 0;
    let left = 0;

    switch (actualPlacement) {
      case 'top':
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.left - contentRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.right + offset;
        break;
    }

    // clamp into viewport
    if (left < margin) left = margin;
    if (left + contentRect.width > viewportW - margin)
      left = viewportW - contentRect.width - margin;
    if (top < margin) top = margin;
    if (top + contentRect.height > viewportH - margin)
      top = viewportH - contentRect.height - margin;

    setPosition({ top, left });
  };

  // Reposition while open (resize + scroll)
  useEffect(() => {
    if (!isOpen) return;
    calculatePosition();

    const onResize = () => calculatePosition();
    const onScroll = (e: Event) => {
      calculatePosition();
      // Always close on *outside* scroll; keep open if the scroll is inside
      if (!eventFromInside(e)) setOpen(false);
    };

    window.addEventListener('resize', onResize, { passive: true });
    // capture phase to catch most ancestors (including document scrolling)
    window.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    });
    document.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, placement, offset]);

  // Close on true outside *click*
  useEffect(() => {
    if (trigger !== 'click' || !isOpen) return;

    const handleClickCapture = (event: MouseEvent) => {
      if (!eventFromInside(event)) setOpen(false);
    };

    document.addEventListener('click', handleClickCapture, true);
    return () => {
      document.removeEventListener('click', handleClickCapture, true);
    };
  }, [trigger, isOpen]);

  const handleTriggerClick = () => {
    if (trigger === 'click') setOpen(!isOpen);
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onClick={handleTriggerClick}
        onMouseEnter={() => trigger === 'hover' && setOpen(true)}
        onMouseLeave={() => trigger === 'hover' && setOpen(false)}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={contentRef}
          className={`fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg ${contentClassName}`}
          style={{ top: position.top, left: position.left }}
          onMouseEnter={() => trigger === 'hover' && setOpen(true)}
          onMouseLeave={() => trigger === 'hover' && setOpen(false)}
        >
          {content}
        </div>
      )}
    </>
  );
};

export { Popover };
export default Popover;
