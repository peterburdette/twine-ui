'use client';

import React, { forwardRef, useRef } from 'react';
import { useFormControl } from '../FormControl/FormControl';

export interface FormControlLabelProps
  extends React.HTMLAttributes<HTMLLabelElement> {
  control: React.ReactElement;
  label?: React.ReactNode | string;
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom';
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FormControlLabel = forwardRef<HTMLLabelElement, FormControlLabelProps>(
  (
    {
      control,
      label,
      labelPlacement = 'end',
      disabled: disabledProp,
      required: requiredProp,
      error: errorProp,
      size: sizeProp,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    const formControl = useFormControl();
    const controlRef = useRef<HTMLInputElement>(null);

    const disabled = disabledProp ?? formControl?.disabled ?? false;
    const required = requiredProp ?? formControl?.required ?? false;
    const error = errorProp ?? formControl?.error ?? false;
    const size = sizeProp ?? formControl?.size ?? 'md';

    // Generate a unique ID for the control if it doesn't have one
    const controlId =
      control.props.id ||
      `form-control-${Math.random().toString(36).substr(2, 9)}`;

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const baseClasses = 'inline-flex items-center cursor-pointer';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
    const errorClasses = error ? 'text-red-600' : 'text-gray-700';

    const labelClasses = `font-medium ${sizeClasses[size]} ${errorClasses}`;

    // Clone the control element and pass down the shared props + ID + ref
    const controlElement = React.cloneElement(control, {
      id: controlId,
      ref: controlRef,
      disabled,
      ...control.props, // Let control override props if needed
    });

    const labelElement = label && (
      <span className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
    );

    const renderContent = () => {
      switch (labelPlacement) {
        case 'start':
          return (
            <>
              {labelElement}
              <span className="ml-3">{controlElement}</span>
            </>
          );
        case 'top':
          return (
            <div className="flex flex-col items-start">
              {labelElement}
              <div className="mt-1">{controlElement}</div>
            </div>
          );
        case 'bottom':
          return (
            <div className="flex flex-col items-start">
              {controlElement}
              {labelElement && <div className="mt-1">{labelElement}</div>}
            </div>
          );
        case 'end':
        default:
          return (
            <>
              {controlElement}
              {labelElement && <span className="ml-3">{labelElement}</span>}
            </>
          );
      }
    };

    return (
      <label
        ref={ref}
        className={`${baseClasses} ${disabledClasses} ${className}`}
        onClick={onClick} // only forward click, don’t override state
        {...props}
      >
        {renderContent()}
      </label>
    );
  }
);

FormControlLabel.displayName = 'FormControlLabel';

export { FormControlLabel };
export default FormControlLabel;
