'use client';

import type React from 'react';
import { forwardRef, useId } from 'react';
import { useFormControl } from '../FormControl/FormControl';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showFocusRing?: boolean;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className = '',
      size: sizeProp = 'md',
      variant: variantProp = 'default',
      showFocusRing = false,
      id,
      disabled: disabledProp,
      required: requiredProp,
      onChange,
      ...props
    },
    ref
  ) => {
    const formControl = useFormControl();
    const stableId = useId();

    // Inherit from FormControl context, but allow props to override
    const disabled = disabledProp ?? formControl?.disabled ?? false;
    const required = requiredProp ?? formControl?.required ?? false;
    const size = sizeProp ?? formControl?.size ?? 'md';
    const variant = variantProp ?? (formControl?.error ? 'error' : 'default');

    const checkboxId = id || `checkbox-${stableId}`;

    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const variantClasses = {
      default: `text-blue-600 ${showFocusRing ? 'focus:ring-blue-500' : ''}`,
      success: `text-green-600 ${showFocusRing ? 'focus:ring-green-500' : ''}`,
      warning: `text-yellow-600 ${
        showFocusRing ? 'focus:ring-yellow-500' : ''
      }`,
      error: `text-red-600 ${showFocusRing ? 'focus:ring-red-500' : ''}`,
    };

    const baseClasses = `rounded border-gray-300 transition-colors ${
      showFocusRing ? 'focus:ring-2 focus:ring-offset-2' : 'focus:outline-none'
    }`;
    const disabledClasses = disabled ? 'cursor-not-allowed' : 'cursor-pointer';
    const checkboxClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabledClasses} ${className}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e);
      }
    };

    return (
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        className={checkboxClasses}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
