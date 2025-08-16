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

    // Prefer control's own id, otherwise use formControl context id, otherwise generate one
    const controlId =
      control.props.id ||
      formControl?.inputId ||
      `form-control-${Math.random().toString(36).slice(2, 11)}`;

    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const baseClasses = 'inline-flex items-center cursor-pointer';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
    const errorClasses = error ? 'text-red-600' : 'text-gray-700';

    const labelClasses = `font-medium ${sizeClasses[size]} ${errorClasses}`;

    // Clone control with shared props
    const controlElement = React.cloneElement(control, {
      id: controlId,
      ref: controlRef,
      disabled,
      ...control.props, // allow explicit props to override
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
        htmlFor={controlId}
        className={`${baseClasses} ${disabledClasses} ${className}`}
        onClick={onClick}
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
