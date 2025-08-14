'use client';

import type React from 'react';
import { forwardRef, useState } from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'square';
  status?: 'online' | 'offline' | 'away' | 'busy';
  fallback?: string;
  onClick?: () => void;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      size = 'md',
      shape = 'circle',
      status,
      fallback,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
      '2xl': 'w-20 h-20 text-2xl',
    };

    const shapeClasses = {
      circle: 'rounded-full',
      square: 'rounded-lg',
    };

    const statusClasses = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500',
      busy: 'bg-red-500',
    };

    const statusSizes = {
      xs: 'w-1.5 h-1.5',
      sm: 'w-2 h-2',
      md: 'w-2.5 h-2.5',
      lg: 'w-3 h-3',
      xl: 'w-4 h-4',
      '2xl': 'w-5 h-5',
    };

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const baseClasses = `relative inline-flex items-center justify-center font-medium text-white bg-gray-500 ${
      sizeClasses[size]
    } ${shapeClasses[shape]} ${
      onClick ? 'cursor-pointer hover:opacity-80' : ''
    } ${className}`;

    return (
      <div
        ref={ref}
        className={baseClasses}
        onClick={onClick}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src || '/placeholder.svg'}
            alt={alt}
            className={`w-full h-full object-cover ${shapeClasses[shape]}`}
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="select-none">
            {fallback ? getInitials(fallback) : alt ? getInitials(alt) : '?'}
          </span>
        )}

        {status && (
          <span
            className={`absolute bottom-0 right-0 ${statusSizes[size]} ${statusClasses[status]} border-2 border-white rounded-full`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar };
export default Avatar;
