import type React from 'react';
import { forwardRef, isValidElement, cloneElement } from 'react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'outlined'
    | 'ghost'
    | 'destructive'
    | 'secondary'
    | 'link'
    | 'success'
    | 'warning'
    | 'info'
    | 'unstyled';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showFocusRing?: boolean;
  asChild?: boolean;

  /** Corner radius — Tailwind tokens or a custom CSS length (e.g., 10, '12px', '1rem', '50%') */
  radius?:
    | 'none'
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | 'full'
    | number
    | string;
}

/** Icon pixels per size (keeps SVGs crisp and vertically centered) */
const ICON_PX = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  icon: 20,
} as const;

/** Map radius tokens → Tailwind classes (custom values handled via inline style) */
const radiusClassFor = (r: ButtonProps['radius']) => {
  const map: Record<string, string> = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };
  if (typeof r === 'string' && r in map) return map[r];
  return ''; // fallback to inline style or default below
};

const radiusStyleFor = (r: ButtonProps['radius']) => {
  if (r == null) return undefined;
  if (typeof r === 'number') return { borderRadius: `${r}px` };
  const tokens = ['none', 'sm', 'md', 'lg', 'xl', '2xl', 'full'];
  if (typeof r === 'string' && tokens.includes(r)) return undefined; // handled by class
  return { borderRadius: r as string };
};

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
      radius = 'md',
      style: styleProp,
      ...props
    },
    ref
  ) => {
    const baseClasses = `inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default ${
      showFocusRing
        ? 'focus:outline-none focus:ring-2 focus:ring-offset-2'
        : 'focus:outline-none'
    }`;

    const variantClasses = {
      default: `bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:hover:bg-blue-600 disabled:active:bg-blue-600 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      outlined: `border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:hover:bg-white disabled:active:bg-white ${
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
      xs: 'px-2.5 py-1 text-xs h-7',
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-sm h-10',
      lg: 'px-6 py-3 text-base h-12',
      xl: 'px-7 py-3.5 text-lg h-14',
      icon: 'p-2 h-10 w-10',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    // Radius class (tokens) + inline style (custom values)
    const radiusClass = radiusClassFor(radius) || 'rounded-md';
    const radiusStyle = radiusStyleFor(radius);

    const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${radiusClass} ${widthClasses} ${className}`;

    const isDisabled = disabled || loading;
    const iconPx = ICON_PX[size];

    const renderIcon = (node: React.ReactNode) => {
      if (!node) return null;
      if (isValidElement(node)) {
        const existing = (node.props as any).className || '';
        return cloneElement(node as React.ReactElement, {
          size: iconPx, // lucide-react numeric size prop
          className: `${existing ? existing + ' ' : ''}shrink-0`,
          'aria-hidden': true,
        });
      }
      // Non-lucide node fallback
      return (
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center shrink-0"
          style={{ width: iconPx, height: iconPx }}
        >
          {node}
        </span>
      );
    };

    const showStartGap = !!children;
    const showEndGap = !!children;

    return (
      <button
        ref={ref}
        className={buttonClasses}
        style={{ ...styleProp, ...(radiusStyle ?? {}) }}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={loading || undefined}
        type={type}
        {...props}
      >
        {loading && (
          <svg
            className={`${children ? 'mr-2' : ''} animate-spin`}
            style={{ width: iconPx, height: iconPx }}
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
            className={showStartGap ? 'mr-2' : ''}
            aria-hidden="true"
          >
            {renderIcon(startIcon)}
          </span>
        )}

        {children}

        {!loading && endIcon && (
          <span
            className={showEndGap ? 'ml-2' : ''}
            aria-hidden="true"
          >
            {renderIcon(endIcon)}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
