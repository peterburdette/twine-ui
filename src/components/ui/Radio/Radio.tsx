import type React from 'react';
import { forwardRef, useId } from 'react';
import { useFormControl } from '../FormControl/FormControl';

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showFocusRing?: boolean;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className = '',
      size: sizeProp = 'md',
      variant: variantProp = 'default',
      showFocusRing = false,
      id,
      disabled: disabledProp,
      required: requiredProp,
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

    const radioId = id || `radio-${stableId}`;

    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const variantClasses = {
      default: `text-blue-600 ${showFocusRing ? 'focus:ring-blue-500' : ''}`,
      success: `text-green-600 ${showFocusRing ? 'focus:ring-green-500' : ''}`,
      warning: `text-yellow-600 ${
        showFocusRing ? 'focus:ring-yellow-500' : ''
      }`,
      error: `text-red-600 ${showFocusRing ? 'focus:ring-red-500' : ''}`,
    };

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';
    const radioClasses = `${sizeClasses[size]} ${
      variantClasses[variant]
    } ${disabledClasses} border-gray-300 ${
      showFocusRing ? 'focus:ring-2 focus:ring-offset-2' : 'focus:outline-none'
    } ${className}`;

    return (
      <input
        ref={ref}
        id={radioId}
        type="radio"
        className={radioClasses}
        disabled={disabled}
        required={required}
        {...props}
      />
    );
  }
);

Radio.displayName = 'Radio';

export { Radio };
export default Radio;
