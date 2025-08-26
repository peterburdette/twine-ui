import type React from 'react';
import { forwardRef } from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'secondary'
    | 'link'
    | 'success'
    | 'warning'
    | 'info'
    | 'unstyled';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showFocusRing?: boolean;
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'default',
      size = 'md',
      fullWidth = false,
      loading = false,
      startIcon,
      endIcon,
      showFocusRing = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses = `inline-flex items-center justify-center font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default ${
      showFocusRing
        ? 'focus:outline-none focus:ring-2 focus:ring-offset-2'
        : 'focus:outline-none'
    }`;

    const variantClasses = {
      default: `bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:hover:bg-blue-600 disabled:active:bg-blue-600 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      outline: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:hover:bg-white disabled:active:bg-white ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      ghost: `text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:hover:bg-transparent disabled:active:bg-transparent ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      destructive: `bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:hover:bg-red-600 disabled:active:bg-red-600 ${
        showFocusRing ? 'focus:ring-red-500' : ''
      }`,
      secondary: `bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 disabled:hover:bg-gray-100 disabled:active:bg-gray-100 ${
        showFocusRing ? 'focus:ring-gray-500' : ''
      }`,
      link: `text-blue-600 underline-offset-4 hover:underline disabled:text-blue-400 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      success: `bg-green-600 text-white hover:bg-green-700 active:bg-green-800 disabled:hover:bg-green-600 disabled:active:bg-green-600 ${
        showFocusRing ? 'focus:ring-green-500' : ''
      }`,
      warning: `bg-yellow-500 text-black hover:bg-yellow-600 active:bg-yellow-700 disabled:hover:bg-yellow-500 disabled:active:bg-yellow-500 ${
        showFocusRing ? 'focus:ring-yellow-400' : ''
      }`,
      info: `bg-sky-500 text-white hover:bg-sky-600 active:bg-sky-700 disabled:hover:bg-sky-500 disabled:active:bg-sky-500 ${
        showFocusRing ? 'focus:ring-sky-400' : ''
      }`,
      unstyled: '', // No styles at all — just raw <button>
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
      icon: 'p-2 h-10 w-10',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${className}`;

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        type={type}
        {...props}
      >
        {loading && (
          <svg
            className={`animate-spin h-4 w-4 ${
              children || startIcon || endIcon ? 'mr-2' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 
                3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && startIcon && (
          <span
            aria-hidden="true"
            className={`${children ? 'mr-2' : ''}`}
          >
            {startIcon}
          </span>
        )}
        {children}
        {!loading && endIcon && (
          <span
            aria-hidden="true"
            className={`${children ? 'ml-2' : ''}`}
          >
            {endIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
