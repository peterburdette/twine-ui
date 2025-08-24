'use client';

import type React from 'react';
import { forwardRef, createContext, useContext } from 'react';

interface RadioGroupContextValue {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const RadioGroupContext = createContext<RadioGroupContextValue | undefined>(
  undefined
);

export const useRadioGroup = () => useContext(RadioGroupContext);

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  orientation?: 'horizontal' | 'vertical';
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      children,
      className = '',
      name,
      value,
      onChange,
      disabled,
      size,
      variant,
      orientation = 'vertical',
      ...props
    },
    ref
  ) => {
    const contextValue: RadioGroupContextValue = {
      name,
      value,
      onChange,
      disabled,
      size,
      variant,
    };

    const orientationClasses =
      orientation === 'horizontal'
        ? 'flex flex-row gap-4 items-center'
        : 'flex flex-col gap-2';

    return (
      <RadioGroupContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={`${orientationClasses} ${className}`}
          role="radiogroup"
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
