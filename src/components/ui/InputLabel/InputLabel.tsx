import type React from 'react';
import { forwardRef } from 'react';
import { useFormControl } from '../FormControl/FormControl';

export interface InputLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  shrink?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  htmlFor?: string;
}

const InputLabel = forwardRef<HTMLLabelElement, InputLabelProps>(
  (
    {
      children,
      className = '',
      shrink,
      variant: variantProp,
      size: sizeProp,
      error: errorProp,
      disabled: disabledProp,
      required: requiredProp,
      htmlFor: htmlForProp,
      ...props
    },
    ref
  ) => {
    const formControl = useFormControl();

    const variant = variantProp ?? formControl?.variant ?? 'standard';
    const size = sizeProp ?? formControl?.size ?? 'md';
    const error = errorProp ?? formControl?.error ?? false;
    const disabled = disabledProp ?? formControl?.disabled ?? false;
    const required = requiredProp ?? formControl?.required ?? false;

    // Use provided htmlFor, or fall back to FormControl's inputId
    const htmlFor = htmlForProp ?? formControl?.inputId;

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const baseClasses = 'block font-medium transition-colors cursor-pointer';

    const variantClasses = {
      standard: 'mb-1',
      outlined: 'mb-1',
      filled: 'mb-1',
    };

    const stateClasses = error
      ? 'text-red-600'
      : disabled
      ? 'text-gray-400'
      : 'text-gray-700';

    const labelClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${stateClasses} ${className}`;

    return (
      <label
        ref={ref}
        htmlFor={htmlFor}
        className={labelClasses}
        {...props}
      >
        {children}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  }
);

InputLabel.displayName = 'InputLabel';

export { InputLabel };
export default InputLabel;
