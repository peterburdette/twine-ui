'use client';

import type React from 'react';
import { forwardRef, createContext, useContext, useId, useState } from 'react';

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  required?: boolean; // NEW: allow radios to inherit
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(
  undefined
);

export const useRadioGroup = () => useContext(RadioGroupContext);

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      children,
      className = '',
      name: nameProp,
      value: valueProp,
      defaultValue,
      onChange,
      disabled,
      required,
      error,
      size,
      variant,
      orientation = 'vertical',
      ...props
    },
    ref
  ) => {
    // Fallback name so radios always behave as one group
    const autoId = useId();
    const name = nameProp ?? `radio-${autoId}`;

    // Controlled vs uncontrolled value
    const isControlled = valueProp !== undefined;
    const [uncontrolled, setUncontrolled] = useState<string | undefined>(
      defaultValue
    );
    const value = isControlled ? valueProp : uncontrolled;

    const handleChange = (v: string) => {
      if (!isControlled) setUncontrolled(v);
      onChange?.(v);
    };

    const contextValue: RadioGroupContextValue = {
      name,
      value,
      onChange: handleChange,
      disabled,
      size,
      variant: variant ?? (error ? 'error' : undefined),
      required,
    };

    const orientationClasses =
      orientation === 'horizontal'
        ? 'flex flex-row gap-4 items-center'
        : 'flex flex-col gap-2';

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          role="radiogroup"
          aria-orientation={
            orientation === 'horizontal' ? 'horizontal' : 'vertical'
          }
          aria-disabled={disabled || undefined}
          aria-required={required || undefined}
          aria-invalid={error || undefined}
          data-orientation={orientation}
          className={`${orientationClasses} ${className}`}
          {...props}
        >
          {children}
        </div>
      </RadioGroupContext.Provider>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

export { RadioGroupContext };
export default RadioGroup;
