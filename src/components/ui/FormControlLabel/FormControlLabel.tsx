'use client';

import React from 'react';
import { forwardRef, useRef } from 'react';
import { useFormControl } from '../FormControl/FormControl';

export interface FormControlLabelProps
  extends React.HTMLAttributes<HTMLLabelElement> {
  control: React.ReactElement;
  label?: React.ReactNode;
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
      size,
      ...(error && { variant: 'error' }),
      ...control.props, // Allow control's own props to override
    });

    const labelElement = label && (
      <span className={labelClasses}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
    );

    const handleClick = (e: React.MouseEvent<HTMLLabelElement>) => {
      if (disabled) {
        e.preventDefault();
        return;
      }

      // Prevent double-clicking if the click originated from the control itself
      if (e.target === controlRef.current) {
        return;
      }

      // Call the original onClick if provided
      onClick?.(e);

      // Handle different control types
      if (controlRef.current) {
        const controlType = controlRef.current.type;

        if (controlType === 'checkbox') {
          // For checkboxes, toggle the checked state
          const currentChecked = controlRef.current.checked;
          controlRef.current.checked = !currentChecked;

          // Trigger change event
          const changeEvent = new Event('change', { bubbles: true });
          controlRef.current.dispatchEvent(changeEvent);

          // Call onChange handler if it exists
          if (control.props.onChange) {
            const syntheticEvent = {
              target: controlRef.current,
              currentTarget: controlRef.current,
            } as React.ChangeEvent<HTMLInputElement>;
            control.props.onChange(syntheticEvent);
          }
        } else if (controlType === 'radio') {
          // For radio buttons, set checked to true
          controlRef.current.checked = true;

          // Trigger change event
          const changeEvent = new Event('change', { bubbles: true });
          controlRef.current.dispatchEvent(changeEvent);

          // Call onChange handler if it exists
          if (control.props.onChange) {
            const syntheticEvent = {
              target: controlRef.current,
              currentTarget: controlRef.current,
            } as React.ChangeEvent<HTMLInputElement>;
            control.props.onChange(syntheticEvent);
          }
        } else {
          // For other inputs (text, etc.), just focus
          controlRef.current.focus();
        }
      }
    };

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
        onClick={handleClick}
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
