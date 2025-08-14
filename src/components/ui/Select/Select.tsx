'use client';

import type React from 'react';
import { forwardRef, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined' | 'ghost' | 'underline';
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  showFocusRing?: boolean;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      options,
      placeholder = 'Select an option...',
      size = 'md',
      variant = 'default',
      value,
      onChange,
      disabled = false,
      required = false,
      showFocusRing = false,
      id,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const triggerRef = useRef<HTMLButtonElement>(null);

    const selectedOption = options.find((option) => option.value === value);

    useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownHeight = Math.min(240, options.length * 40); // Estimate dropdown height

        // Calculate if dropdown should open upward
        const spaceBelow = viewportHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUpward =
          spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

        setDropdownPosition({
          top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    }, [isOpen, options.length]);

    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleScroll = () => {
        setIsOpen(false);
      };

      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }, [isOpen]);

    const baseClasses = `w-full rounded-md border transition-colors text-left ${
      showFocusRing
        ? 'focus:outline-none focus:ring-2 focus:ring-offset-2'
        : 'focus:outline-none'
    }`;

    const variantClasses = {
      default: `border-gray-300 bg-white focus:border-blue-500 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      filled: `border-transparent bg-gray-100 focus:bg-white focus:border-blue-500 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      outlined: `border-2 border-gray-300 bg-transparent focus:border-blue-500 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      ghost: `border-transparent bg-transparent hover:bg-gray-50 focus:bg-white focus:border-blue-500 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
      underline: `border-0 border-b-2 border-gray-300 bg-transparent rounded-none focus:border-b-blue-500 ${
        showFocusRing ? 'focus:ring-blue-500' : ''
      }`,
    };

    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const errorClasses = error
      ? variant === 'underline'
        ? '!border-b-red-500 focus:!border-b-red-500 hover:!border-b-red-500'
        : '!border-red-500 focus:!border-red-500 hover:!border-red-500 focus:!ring-red-500'
      : '';

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    const selectClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${errorClasses} ${disabledClasses} ${className}`;

    const handleOptionSelect = (optionValue: string) => {
      if (!disabled) {
        onChange?.(optionValue);
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(!isOpen);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Handle option navigation
          const currentIndex = options.findIndex((opt) => opt.value === value);
          const nextIndex =
            e.key === 'ArrowDown'
              ? Math.min(currentIndex + 1, options.length - 1)
              : Math.max(currentIndex - 1, 0);

          const nextOption = options[nextIndex];
          if (nextOption && !nextOption.disabled) {
            onChange?.(nextOption.value);
          }
        }
      }
    };

    const DropdownPortal = () => {
      if (!isOpen || typeof window === 'undefined') return null;

      return createPortal(
        <div
          className="fixed bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
            zIndex: 999999,
          }}
        >
          <div
            className="py-1"
            role="listbox"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  option.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : value === option.value
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() =>
                  !option.disabled && handleOptionSelect(option.value)
                }
                disabled={option.disabled}
                role="option"
                aria-selected={value === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>,
        document.body
      );
    };

    return (
      <div
        className="w-full"
        ref={ref}
      >
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <button
            ref={triggerRef}
            id={selectId}
            type="button"
            className={selectClasses}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-required={required}
          >
            <span
              className={selectedOption ? 'text-gray-900' : 'text-gray-500'}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>

          <DropdownPortal />
        </div>

        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export default Select;
