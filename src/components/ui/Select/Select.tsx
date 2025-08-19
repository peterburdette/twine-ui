'use client';

import type React from 'react';
import { forwardRef, useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined' | 'ghost' | 'underline';
  fullWidth?: boolean;
  required?: boolean;
  showFocusRing?: boolean;
  id?: string;
}

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
      label,
      error,
      helperText,
      disabled = false,
      size = 'md',
      variant = 'default',
      fullWidth = false,
      required = false,
      showFocusRing = false,
      id,
      className = '',
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
    const selectRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;

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
      const handleClickOutside = (event: MouseEvent) => {
        if (
          selectRef.current &&
          !selectRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
        }
      };

      const handleScroll = () => {
        setIsOpen(false);
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }, [isOpen]);

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const variantClasses = {
      default: 'border border-gray-300 bg-white hover:bg-gray-50',
      filled: 'border-transparent bg-gray-100 hover:bg-white',
      outlined: 'border-2 border-gray-300 bg-transparent hover:bg-white',
      ghost: 'border border-transparent bg-transparent hover:bg-gray-50',
      underline:
        'border-0 border-b-2 border-gray-300 bg-transparent rounded-none hover:border-b-gray-50',
    };

    const errorClasses = error
      ? variant === 'underline'
        ? '!border-b-red-500 focus:!border-b-red-500 hover:!border-b-red-500'
        : '!border-red-500 focus:!border-red-500 hover:!border-red-500 focus:!ring-red-500'
      : '';

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    const selectClasses = cn(
      'relative w-full flex items-center justify-between rounded-md transition-colors focus:outline-none',
      sizeClasses[size],
      variantClasses[variant],
      errorClasses,
      disabledClasses,
      showFocusRing && 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      className
    );

    const handleOptionSelect = (optionValue: string) => {
      if (!disabled) {
        onChange?.(optionValue);
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          setIsOpen(!isOpen);
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            const currentIndex = options.findIndex(
              (opt) => opt.value === value
            );
            const nextIndex = Math.min(currentIndex + 1, options.length - 1);
            const nextOption = options[nextIndex];
            if (nextOption && !nextOption.disabled) {
              onChange?.(nextOption.value);
            }
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            const currentIndex = options.findIndex(
              (opt) => opt.value === value
            );
            const nextIndex = Math.max(currentIndex - 1, 0);
            const nextOption = options[nextIndex];
            if (nextOption && !nextOption.disabled) {
              onChange?.(nextOption.value);
            }
          }
          break;
      }
    };

    const DropdownPortal = () => {
      if (!isOpen || typeof window === 'undefined') return null;

      return createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
            role="listbox"
            aria-labelledby={selectId}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No options available
              </div>
            ) : (
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors',
                    option.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100',
                    value === option.value && 'bg-blue-50 text-blue-600'
                  )}
                  onClick={() =>
                    !option.disabled && handleOptionSelect(option.value)
                  }
                  disabled={option.disabled}
                  role="option"
                  aria-selected={value === option.value}
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.value && (
                    <Check className="h-4 w-4 text-blue-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            )}
          </div>
        </>,
        document.body
      );
    };

    return (
      <div
        ref={selectRef}
        className="w-full"
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

        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          tabIndex={disabled ? -1 : 0}
          className={selectClasses}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          aria-required={required}
        >
          <span className={cn('truncate', !selectedOption && 'text-gray-500')}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 text-gray-400 transition-transform flex-shrink-0 ml-2',
              isOpen && 'rotate-180'
            )}
          />
        </button>

        {DropdownPortal()}

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
