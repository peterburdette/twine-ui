'use client';

import React, { forwardRef, useId } from 'react';
import { useFormControl } from '../FormControl/FormControl';

type ControlProps = {
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
};

export interface FormControlLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  label?: React.ReactNode | string;
  labelPlacement?: 'end' | 'start' | 'top' | 'bottom';
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactElement<ControlProps>;
}

const FormControlLabel = forwardRef<HTMLLabelElement, FormControlLabelProps>(
  (
    {
      children,
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
    const stableId = useId();

    const disabled = disabledProp ?? formControl?.disabled ?? false;
    const required = requiredProp ?? formControl?.required ?? false;
    const error = errorProp ?? formControl?.error ?? false;
    const size = sizeProp ?? formControl?.size ?? 'md';

    const control = children as React.ReactElement<ControlProps>;
    const controlId =
      control.props.id || formControl?.inputId || `form-control-${stableId}`;

    const isVertical = labelPlacement === 'top' || labelPlacement === 'bottom';

    const baseClasses = 'inline-flex';
    const orientationClasses = isVertical
      ? 'flex-col items-start gap-1'
      : 'flex-row items-center gap-3';
    const disabledClasses = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

    const sizeClasses = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' };
    const labelColor = error ? 'text-red-600' : 'text-gray-700';
    const labelClasses = `font-medium ${sizeClasses[size]} ${labelColor}`;

    const controlElement = React.cloneElement<ControlProps>(control, {
      id: controlId,
      disabled: control.props.disabled ?? disabled,
      'aria-invalid': control.props['aria-invalid'] ?? (error || undefined),
      'aria-required':
        control.props['aria-required'] ?? (required || undefined),
    });

    const labelElement =
      label != null ? (
        <span className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </span>
      ) : null;

    const labelFirst = labelPlacement === 'start' || labelPlacement === 'top';

    return (
      <label
        ref={ref}
        htmlFor={controlId}
        className={`${baseClasses} ${orientationClasses} ${disabledClasses} ${className}`}
        data-orientation={isVertical ? 'vertical' : 'horizontal'}
        onClick={onClick}
        {...props}
      >
        {labelFirst && labelElement}
        {controlElement}
        {!labelFirst && labelElement}
      </label>
    );
  }
);

FormControlLabel.displayName = 'FormControlLabel';

export { FormControlLabel };
export default FormControlLabel;
