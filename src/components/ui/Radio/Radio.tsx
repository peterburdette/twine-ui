'use client';

import type React from 'react';
import { forwardRef, useId } from 'react';
import { useFormControl } from '../FormControl/FormControl';
import { useRadioGroup } from '../RadioGroup/RadioGroup';

export interface RadioProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size' | 'onChange'
  > {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showFocusRing?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className = '',
      // NOTE: no defaults here so we can inherit from RadioGroup/FormControl
      size: sizeProp,
      variant: variantProp,
      showFocusRing = false,
      id,
      disabled: disabledProp,
      required: requiredProp,
      name: nameProp,
      value,
      checked: checkedProp,
      onChange,
      ...props
    },
    ref
  ) => {
    const formControl = useFormControl();
    const radioGroup = useRadioGroup();
    const stableId = useId();

    // Inheritance chain: prop -> group -> form control -> fallback
    const disabled =
      disabledProp ?? radioGroup?.disabled ?? formControl?.disabled ?? false;

    const required =
      requiredProp ?? radioGroup?.required ?? formControl?.required ?? false;

    const size = sizeProp ?? radioGroup?.size ?? formControl?.size ?? 'md';

    const variant: NonNullable<RadioProps['variant']> =
      variantProp ??
      radioGroup?.variant ??
      (formControl?.error ? 'error' : 'default');

    const name = nameProp ?? radioGroup?.name;

    const checked =
      checkedProp ??
      (radioGroup?.value !== undefined
        ? radioGroup.value === value
        : undefined);

    const radioId = id || formControl?.inputId || `radio-${stableId}`;

    // A11y: compute describedBy from surrounding FormControl (if available) and any passed-in aria-describedby
    const describedBy =
      [
        (props['aria-describedby'] as string | undefined) || undefined,
        (formControl as any)?.describedBy,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    // Consider invalid if variant is 'error' or FormControl marks an error
    const isInvalid = variant === 'error' || !!formControl?.error;

    const sizeClasses: Record<NonNullable<RadioProps['size']>, string> = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const variantClasses: Record<NonNullable<RadioProps['variant']>, string> = {
      default: `accent-blue-600 ${showFocusRing ? 'focus:ring-blue-500' : ''}`,
      success: `accent-green-600 ${
        showFocusRing ? 'focus:ring-green-500' : ''
      }`,
      warning: `accent-yellow-600 ${
        showFocusRing ? 'focus:ring-yellow-500' : ''
      }`,
      error: `accent-red-600 ${showFocusRing ? 'focus:ring-red-500' : ''}`,
    };

    const disabledClasses = disabled ? 'cursor-not-allowed' : 'cursor-pointer';

    const radioClasses = [
      sizeClasses[size],
      variantClasses[variant],
      disabledClasses,
      'border border-gray-300 rounded-full',
      showFocusRing ? 'focus:ring-2 focus:ring-offset-2' : 'focus:outline-none',
      className,
    ].join(' ');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(event);
      if (radioGroup?.onChange && value !== undefined) {
        radioGroup.onChange(value.toString());
      }
    };

    return (
      <input
        ref={ref}
        id={radioId}
        type="radio"
        style={{
          appearance: 'auto',
          opacity: 1,
          position: 'static',
          display: 'inline-block',
        }}
        className={radioClasses}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        // A11y
        aria-disabled={disabled || undefined}
        aria-required={required || undefined}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        {...props}
      />
    );
  }
);

Radio.displayName = 'Radio';

export { Radio };
export default Radio;
