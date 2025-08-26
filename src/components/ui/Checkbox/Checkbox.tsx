'use client';

import type React from 'react';
import {
  ChangeEvent,
  forwardRef,
  MutableRefObject,
  useEffect,
  useId,
  useRef,
} from 'react';
import { useFormControl } from '../FormControl/FormControl';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showFocusRing?: boolean;
  indeterminate?: boolean;
  clearIndeterminateOnChange?: boolean;
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
      indeterminate: indeterminateProp,
      clearIndeterminateOnChange = true,
      'aria-invalid': ariaInvalidProp,
      'aria-describedby': ariaDescribedByProp,
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

    const sizeClasses = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' };
    const variantClasses = {
      default: `accent-blue-600 ${
        showFocusRing ? 'focus:ring-blue-500 focus-visible:ring-blue-500' : ''
      }`,
      success: `accent-green-600 ${
        showFocusRing ? 'focus:ring-green-500 focus-visible:ring-green-500' : ''
      }`,
      warning: `accent-yellow-600 ${
        showFocusRing
          ? 'focus:ring-yellow-500 focus-visible:ring-yellow-500'
          : ''
      }`,
      error: `accent-red-600 ${
        showFocusRing ? 'focus:ring-red-500 focus-visible:ring-red-500' : ''
      }`,
    };

    const baseClasses = [
      'rounded',
      'border',
      'border-gray-300',
      'transition-colors',
      showFocusRing
        ? 'focus:ring-2 focus:ring-offset-2 focus-visible:ring-2 focus-visible:ring-offset-2'
        : 'focus:outline-none',
      disabled ? 'cursor-not-allowed' : 'cursor-pointer',
    ].join(' ');

    const checkboxClasses = [
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      className,
    ].join(' ');

    const innerRef = useRef<HTMLInputElement | null>(null);

    // Keep the native property in sync with the prop
    useEffect(() => {
      if (innerRef.current)
        innerRef.current.indeterminate = !!indeterminateProp;
    }, [indeterminateProp]);

    // Merge refs
    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref)
        (ref as MutableRefObject<HTMLInputElement | null>).current = node;
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      // For uncontrolled "mixed" usage, clear the dash once the user interacts,
      // unless the dev is controlling indeterminate via props.
      if (
        indeterminateProp === undefined &&
        clearIndeterminateOnChange &&
        innerRef.current
      ) {
        innerRef.current.indeterminate = false;
      }
      onChange?.(e);
    };

    // NEW: compose aria-describedby from context + prop
    const describedByIds: string[] = [];
    if (formControl?.descriptionId)
      describedByIds.push(formControl.descriptionId);
    if (formControl?.error && formControl?.errorId)
      describedByIds.push(formControl.errorId);
    if (ariaDescribedByProp) {
      describedByIds.push(
        ...String(ariaDescribedByProp).split(' ').filter(Boolean)
      );
    }
    const ariaDescribedBy = describedByIds.length
      ? describedByIds.join(' ')
      : undefined;

    const ariaInvalid = ariaInvalidProp ?? (formControl?.error || undefined);

    return (
      <input
        ref={setRefs}
        id={checkboxId}
        type="checkbox"
        className={checkboxClasses}
        disabled={disabled}
        required={required}
        aria-required={required || undefined}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-checked={indeterminateProp ? 'mixed' : undefined}
        onChange={handleChange}
        {...props}
      />
    );
  }
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
export default Checkbox;
