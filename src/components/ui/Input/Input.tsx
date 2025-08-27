'use client';

import type React from 'react';
import { forwardRef, useState, useEffect, useId } from 'react';
import { useFormControl } from '../FormControl/FormControl';
import { Select } from '../Select/Select';

export interface InputSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // Core props
  label?: string;
  error?: string;
  helperText?: string;
  variant?:
    | 'default'
    | 'underline'
    | 'filled'
    | 'outlined'
    | 'ghost'
    | 'floating'
    | 'inset';
  inputSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showFocusRing?: boolean;
  disableFocusStyles?: boolean;

  // Icons and adornments
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;

  // Inline elements - updated structure
  inlineSelect?: {
    options: InputSelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    position?: 'left' | 'right';
  };
  inlineButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  inlineLabel?: {
    text: string;
    position?: 'left' | 'right';
  };
  inlineAddOn?: {
    content: React.ReactNode;
    position?: 'left' | 'right';
  };

  // Layout
  fullWidth?: boolean;
  width?: string;

  // State overrides
  disabled?: boolean;
  required?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error: errorProp,
      helperText,
      variant = 'default',
      inputSize = 'md',
      showFocusRing = false,
      disableFocusStyles = false,
      startIcon,
      endIcon,
      startAdornment,
      endAdornment,
      inlineSelect,
      inlineButton,
      inlineLabel,
      inlineAddOn,
      fullWidth = false,
      type = 'text',
      id: idProp,
      disabled: disabledProp,
      required: requiredProp,
      placeholder,
      value,
      onChange,
      onFocus,
      onBlur,
      width,
      ...props
    },
    ref
  ) => {
    const formControl = useFormControl();
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const stableId = useId();

    // Inherit from FormControl context, but allow props to override
    const error = errorProp ?? formControl?.error ?? false;
    const disabled = disabledProp ?? formControl?.disabled ?? false;
    const required = requiredProp ?? formControl?.required ?? false;

    const inputId = idProp || formControl?.inputId || `input-${stableId}`;

    // === A11y: derive helper/error IDs and describedby ===
    const helperId = helperText ? `${inputId}-help` : undefined;
    const errorText = typeof error === 'string' ? error : undefined;
    const errorId = errorText ? `${inputId}-error` : undefined;
    const describedBy =
      [
        (props['aria-describedby'] as string | undefined) || undefined,
        helperId,
        errorText ? errorId : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    // Check if input has value
    useEffect(() => {
      const currentValue = value ?? '';
      setHasValue(String(currentValue).length > 0);
    }, [value]);

    // Handle focus
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(event);
    };

    // Handle blur
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    };

    // Handle change to track value state
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(event.target.value.length > 0);
      onChange?.(event);
    };

    // Copy functionality for inline button
    const handleCopy = async () => {
      if (inlineButton?.label === 'Copy' && value) {
        try {
          await navigator.clipboard.writeText(String(value));
          // You could add a toast notification here
        } catch (err) {
          console.error('Failed to copy text: ', err);
        }
      }
      inlineButton?.onClick();
    };

    // Size classes
    const sizeClasses = {
      xs: {
        input: 'px-2 py-1 text-xs',
        icon: 'w-3 h-3',
        label: 'text-xs',
        helper: 'text-xs',
      },
      sm: {
        input: 'px-2.5 py-1.5 text-sm',
        icon: 'w-4 h-4',
        label: 'text-sm',
        helper: 'text-xs',
      },
      md: {
        input: 'px-3 py-2 text-base',
        icon: 'w-5 h-5',
        label: 'text-sm',
        helper: 'text-sm',
      },
      lg: {
        input: 'px-4 py-3 text-lg',
        icon: 'w-6 h-6',
        label: 'text-base',
        helper: 'text-base',
      },
      xl: {
        input: 'px-5 py-4 text-xl',
        icon: 'w-7 h-7',
        label: 'text-lg',
        helper: 'text-lg',
      },
    };

    // Variant-specific classes
    const getVariantClasses = () => {
      const disabledClasses = disabled
        ? 'opacity-50 cursor-not-allowed bg-gray-50'
        : '';

      // Base focus classes for most variants
      const baseFocusClasses =
        'focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50';

      // Special focus classes for underline (no ring, only bottom border)
      const underlineFocusClasses =
        'focus:outline-none focus:border-b-blue-500';

      // Error classes that work with focus
      const getErrorClasses = () => {
        if (!error) return '';

        if (variant === 'underline') {
          return '!border-b-red-500 focus:!border-b-red-500';
        }

        return '!border-red-500 focus:!border-red-500 focus:!ring-red-500/50';
      };

      const errorClasses = getErrorClasses();

      switch (variant) {
        case 'underline':
          return `border-0 border-b-2 border-gray-300 bg-transparent rounded-none ${underlineFocusClasses} ${errorClasses} ${disabledClasses}`;

        case 'filled':
          return `border border-gray-300 bg-gray-100 rounded-md focus:bg-white ${baseFocusClasses} ${errorClasses} ${disabledClasses}`;

        case 'outlined':
          return `border-2 border-gray-300 bg-white rounded-md ${baseFocusClasses} ${errorClasses} ${disabledClasses}`;

        case 'ghost':
          return `border border-transparent bg-transparent hover:bg-gray-50 rounded-md focus:bg-white ${baseFocusClasses} ${errorClasses} ${disabledClasses}`;

        case 'floating':
          return `border border-gray-300 bg-white rounded-md ${baseFocusClasses} ${errorClasses} ${disabledClasses}`;

        case 'inset':
          return `border border-gray-300 bg-white rounded-md pt-6 ${baseFocusClasses} ${errorClasses} ${disabledClasses}`;

        case 'default':
        default:
          return `block w-full rounded-md border border-gray-300 ${baseFocusClasses} disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 transition-colors ${errorClasses} ${disabledClasses}`;
      }
    };

    // Calculate padding for different inline elements
    const getInputPadding = () => {
      let leftPadding = '';
      let rightPadding = '';

      // Handle inline select positioning with wider spacing
      if (inlineSelect?.position === 'left') {
        leftPadding = 'pl-24';
      } else if (inlineSelect?.position === 'right') {
        rightPadding = 'pr-24';
      }

      // Handle inline label positioning
      if (inlineLabel?.position === 'left') {
        leftPadding = 'pl-8';
      } else if (inlineLabel?.position === 'right') {
        rightPadding = 'pr-8';
      }

      // Handle inline add-on positioning
      if (inlineAddOn?.position === 'left') {
        leftPadding = 'pl-8';
      } else if (inlineAddOn?.position === 'right') {
        rightPadding = 'pr-8';
      }

      // Handle icons with proper spacing
      if (endIcon && !rightPadding) {
        rightPadding = 'pr-10';
      }

      // Handle icons
      if (startIcon && !leftPadding) {
        leftPadding = 'pl-10';
      }

      return `${leftPadding} ${rightPadding}`.trim();
    };

    // Label classes for floating and inset variants
    const getLabelClasses = () => {
      const baseLabel = `absolute transition-all duration-200 pointer-events-none ${sizeClasses[inputSize].label}`;
      const shouldShrink = focused || hasValue || !!placeholder;

      if (variant === 'floating') {
        return `${baseLabel} ${
          shouldShrink
            ? `top-0 left-1 -translate-y-1/2 scale-75 bg-white px-1 ${
                focused ? 'text-blue-600' : 'text-gray-600'
              }`
            : 'top-1/2 left-1 -translate-y-1/2 text-gray-500'
        } ${error ? 'text-red-600' : ''}`;
      }

      if (variant === 'inset') {
        return `absolute top-2.5 left-3 flex items-center text-gray-500 block text-xs font-medium text-gray-700`;
      }

      return '';
    };

    // Render inline add-on structure
    const renderInlineAddOn = () => {
      if (!inlineAddOn) return null;

      const position = inlineAddOn.position || 'right';
      const positionClasses =
        position === 'left'
          ? 'inset-y-0 left-0 flex items-center rounded-md rounded-r-none border border-r-0 border-gray-300 bg-gray-100 px-2.5 text-gray-700'
          : 'inset-y-0 right-0 flex items-center rounded-md rounded-l-none border border-l-0 border-gray-300 bg-gray-100 px-2.5 text-gray-700';

      return <div className={positionClasses}>{inlineAddOn.content}</div>;
    };

    // Render inline button structure
    const renderInlineButton = () => {
      if (!inlineButton) return null;

      return (
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 rounded-md rounded-l-none border border-l-0 border-gray-300 px-2.5 text-gray-700 hover:bg-gray-100"
          disabled={disabled}
        >
          {inlineButton.icon && inlineButton.icon}
          <span>{inlineButton.label}</span>
        </button>
      );
    };

    // Render inline select with reusable Select component
    const renderInlineSelect = () => {
      if (!inlineSelect) return null;

      const position = inlineSelect.position || 'left';
      const positionClasses =
        position === 'left'
          ? 'absolute inset-y-0 left-0 flex items-center text-gray-500'
          : 'absolute inset-y-0 right-0 flex items-center text-gray-500';

      return (
        <div className={positionClasses}>
          <div className="h-full flex items-center">
            <Select
              options={inlineSelect.options}
              value={inlineSelect.value}
              onChange={(value) => inlineSelect.onChange?.(value)}
              placeholder={inlineSelect.placeholder}
              disabled={disabled}
              size="sm"
              variant="ghost"
              className="border-0 bg-transparent shadow-none min-w-[80px] w-auto max-w-[120px]"
            />
          </div>
        </div>
      );
    };

    // Render inline label
    const renderInlineLabel = () => {
      if (!inlineLabel) return null;

      const position = inlineLabel.position || 'left';
      const positionClasses =
        position === 'left'
          ? 'pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-gray-500'
          : 'pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500';

      return <div className={positionClasses}>{inlineLabel.text}</div>;
    };

    // Check if we need flex wrapper (for inline add-on or button)
    const needsFlexWrapper = inlineAddOn || inlineButton;

    // Input element classes
    const inputClasses = `${getVariantClasses()} ${
      sizeClasses[inputSize].input
    } ${getInputPadding()} ${fullWidth ? 'w-full' : ''} ${
      needsFlexWrapper
        ? inlineAddOn?.position === 'left'
          ? 'rounded-l-none'
          : 'rounded-r-none'
        : ''
    } ${needsFlexWrapper ? 'focus:z-10' : ''} ${className}`;

    // Container classes with width control
    const containerClasses = `${fullWidth ? 'w-full' : width ? width : 'w-64'}`;

    // Helper text classes
    const helperTextClasses = `mt-1 ${sizeClasses[inputSize].helper} ${
      error ? 'text-red-600' : 'text-gray-500'
    }`;

    return (
      <div className={containerClasses}>
        {/* Standard Label (not floating/inset) */}
        {label && !['floating', 'inset'].includes(variant) && (
          <label
            htmlFor={inputId}
            className={`mb-1 block ${sizeClasses[inputSize].label} font-medium text-gray-700 cursor-pointer`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input Container */}
        {needsFlexWrapper ? (
          <div className="relative z-0 flex">
            {/* Left side add-on */}
            {inlineAddOn?.position === 'left' && renderInlineAddOn()}

            {/* Input with relative positioning for overlays */}
            <div className="relative flex-1">
              {/* Floating/Inset Label */}
              {label && ['floating', 'inset'].includes(variant) && (
                <label
                  htmlFor={inputId}
                  className={getLabelClasses()}
                >
                  {label}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </label>
              )}

              {/* Inline Select */}
              {renderInlineSelect()}

              {/* Inline Label */}
              {renderInlineLabel()}

              {/* Start Icon */}
              {startIcon && (
                <div
                  aria-hidden="true"
                  className={`absolute left-3 top-1/2 -translate-y-1/2 ${sizeClasses[inputSize].icon} text-gray-400 pointer-events-none`}
                >
                  {startIcon}
                </div>
              )}

              {/* End Icon */}
              {endIcon && (
                <div
                  aria-hidden="true"
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${sizeClasses[inputSize].icon} text-gray-400 pointer-events-none`}
                >
                  {endIcon}
                </div>
              )}

              {/* Input */}
              <input
                ref={ref}
                id={inputId}
                type={type}
                className={inputClasses}
                placeholder={
                  ['floating', 'inset'].includes(variant) &&
                  (focused || hasValue)
                    ? placeholder
                    : placeholder
                }
                disabled={disabled}
                required={required}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                aria-invalid={!!error || undefined}
                aria-required={required || undefined}
                aria-disabled={disabled || undefined}
                aria-errormessage={errorText ? errorId : undefined}
                aria-describedby={describedBy}
                {...props}
              />
            </div>

            {/* Right side add-on or button */}
            {inlineAddOn?.position === 'right' && renderInlineAddOn()}
            {inlineButton && renderInlineButton()}
          </div>
        ) : (
          <div className="relative">
            {/* Floating/Inset Label */}
            {label && ['floating', 'inset'].includes(variant) && (
              <label
                htmlFor={inputId}
                className={getLabelClasses()}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
            )}

            {/* Inline Select */}
            {renderInlineSelect()}

            {/* Inline Label */}
            {renderInlineLabel()}

            {/* Start Icon */}
            {startIcon && (
              <div
                aria-hidden="true"
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${sizeClasses[inputSize].icon} text-gray-400 pointer-events-none`}
              >
                {startIcon}
              </div>
            )}

            {/* End Icon */}
            {endIcon && (
              <div
                aria-hidden="true"
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${sizeClasses[inputSize].icon} text-gray-400 pointer-events-none`}
              >
                {endIcon}
              </div>
            )}

            {/* Input */}
            <input
              ref={ref}
              id={inputId}
              type={type}
              className={inputClasses}
              placeholder={
                ['floating', 'inset'].includes(variant) && (focused || hasValue)
                  ? placeholder
                  : placeholder
              }
              disabled={disabled}
              required={required}
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-invalid={!!error || undefined}
              aria-required={required || undefined}
              aria-disabled={disabled || undefined}
              aria-errormessage={errorText ? errorId : undefined}
              aria-describedby={describedBy}
              {...props}
            />
          </div>
        )}

        {/* Helper / Error Text (live region) */}
        {(helperText || errorText) && (
          <div
            id={errorText ? errorId : helperId}
            className={helperTextClasses}
            aria-live="polite"
            aria-atomic="true"
          >
            {errorText || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
