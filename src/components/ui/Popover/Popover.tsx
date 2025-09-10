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

  const calculatePosition = () => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let top = 0;
    let left = 0;

    switch (placement) {
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

    // Clamp to viewport
    if (left < 8) left = 8;
    if (left + contentRect.width > viewport.width) {
      left = viewport.width - contentRect.width - 8;
    }
    if (top < 8) top = 8;
    if (top + contentRect.height > viewport.height) {
      top = viewport.height - contentRect.height - 8;
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (!isOpen) return;
    calculatePosition();

    const onResize = () => calculatePosition();
    const onScroll = () => calculatePosition();

    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('scroll', onScroll, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [isOpen, placement, offset]);

  const isFromKeepOpenPortal = (target: EventTarget | null) =>
    !!(
      target instanceof Element &&
      target.closest('[data-twine-keepopen="true"]')
    );

  useEffect(() => {
    if (trigger !== 'click' || !isOpen) return;

    const handlePointerDownCapture = (event: PointerEvent) => {
      const t = event.target as Node | null;

      // If the click happens inside the trigger, the popover, or a "keepopen" portal, ignore
      if (
        (triggerRef.current && triggerRef.current.contains(t)) ||
        (contentRef.current && contentRef.current.contains(t)) ||
        isFromKeepOpenPortal(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    const handleClickCapture = (event: MouseEvent) => {
      const t = event.target as Node | null;
      if (
        (triggerRef.current && triggerRef.current.contains(t)) ||
        (contentRef.current && contentRef.current.contains(t)) ||
        isFromKeepOpenPortal(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    // Use CAPTURE so we run early and make a keep-open decision for portals
    document.addEventListener('pointerdown', handlePointerDownCapture, true);
    document.addEventListener('click', handleClickCapture, true);
    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDownCapture,
        true
      );
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
