'use client';

import type React from 'react';
import { useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';

// Dialog size variants
export type DialogSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Dialog context
interface DialogContextType {
  open: boolean;
  onClose: () => void;
  size: DialogSize;
  fullWidth: boolean;
  fullScreen: boolean;
  disableBackdropClick: boolean;
  disableEscapeKeyDown: boolean;
}

export const DialogContext = createContext<DialogContextType | null>(null);

export const useDialogContext = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

// Dialog props interface
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  size?: DialogSize;
  fullWidth?: boolean;
  fullScreen?: boolean;
  disableBackdropClick?: boolean;
  disableEscapeKeyDown?: boolean;
  className?: string;
  backdropClassName?: string;
}

export const Dialog = ({
  open,
  onClose,
  children,
  size = 'md',
  fullWidth = false,
  fullScreen = false,
  disableBackdropClick = true,
  disableEscapeKeyDown = false,
  className = '',
  backdropClassName = '',
}: DialogProps) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!open || disableEscapeKeyDown) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, disableEscapeKeyDown]);

  // Focus management
  useEffect(() => {
    if (open) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else {
      previousActiveElement.current?.focus();
    }
  }, [open]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (!disableBackdropClick) {
      onClose();
    }
  };

  const contextValue: DialogContextType = {
    open,
    onClose,
    size,
    fullWidth,
    fullScreen,
    disableBackdropClick,
    disableEscapeKeyDown,
  };

  const dialogContent = (
    <DialogContext.Provider value={contextValue}>
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${backdropClassName}`}
      >
        <div
          className="absolute inset-0 bg-black/50 transition-opacity duration-300"
          onClick={handleBackdropClick}
        />
        <div className={`relative ${className}`}>{children}</div>
      </div>
    </DialogContext.Provider>
  );

  return createPortal(dialogContent, document.body);
};
