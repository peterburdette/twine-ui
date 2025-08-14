'use client';

import type React from 'react';
import { useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useDialogContext } from './Dialog';

// Size mappings
const sizeClasses: Record<string, string> = {
  xs: 'w-80 max-w-[90vw]', // 320px
  sm: 'w-96 max-w-[90vw]', // 384px
  md: 'w-[28rem] max-w-[90vw]', // 448px
  lg: 'w-[40rem] max-w-[90vw]', // 640px
  xl: 'w-[48rem] max-w-[90vw]', // 768px
};

export interface DialogPanelProps {
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const DialogPanel = ({
  children,
  className = '',
  showCloseButton = false,
}: DialogPanelProps) => {
  const { size, fullWidth, fullScreen, onClose } = useDialogContext();
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    setTimeout(() => {
      panelRef.current?.focus();
    }, 0);
  }, []);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
      className={`
        relative bg-white rounded-lg shadow-xl transform transition-all duration-300 scale-100 max-h-[90vh]
        ${
          fullScreen
            ? 'w-full h-full max-w-none max-h-none rounded-none flex flex-col'
            : fullWidth
            ? 'w-full max-w-4xl'
            : sizeClasses[size]
        }
        ${className}
      `}
    >
      {showCloseButton && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      )}
      {children}
    </div>
  );
};
