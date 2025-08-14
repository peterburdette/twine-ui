'use client';

import type React from 'react';
import { forwardRef } from 'react';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error';
  size?: 'sm' | 'md' | 'lg';
  removable?: boolean;
  onRemove?: () => void;
  icon?: React.ReactNode;
}

const Chip = forwardRef<HTMLSpanElement, ChipProps>(
  (
    {
      children,
      variant = 'default',
      size = 'md',
      removable = false,
      onRemove,
      icon,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center font-medium rounded-full transition-colors';

    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-1.5 text-sm',
      lg: 'px-4 py-2 text-base',
    };

    const variantClasses = {
      default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      primary: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      secondary: 'bg-purple-100 text-purple-800 hover:bg-purple-200',
      success: 'bg-green-100 text-green-800 hover:bg-green-200',
      warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
      error: 'bg-red-100 text-red-800 hover:bg-red-200',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const chipClasses = `${baseClasses} ${sizeClasses[size]} ${
      variantClasses[variant]
    } ${onClick ? 'cursor-pointer' : ''} ${className}`;

    return (
      <span
        ref={ref}
        className={chipClasses}
        onClick={onClick}
        {...props}
      >
        {icon && <span className={`${iconSizes[size]} mr-1.5`}>{icon}</span>}
        <span>{children}</span>
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className={`ml-1.5 ${iconSizes[size]} hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors`}
          >
            <svg
              fill="currentColor"
              viewBox="0 0 20 20"
              className="w-full h-full"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Chip.displayName = 'Chip';

export { Chip };
export default Chip;
