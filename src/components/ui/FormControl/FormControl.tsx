'use client';

import React, { useMemo } from 'react';
import { forwardRef, createContext, useContext } from 'react';

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
}

interface FormControlContextValue {
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  inputId?: string;
}

const FormControlContext = createContext<FormControlContextValue | undefined>(
  undefined
);

export const useFormControl = () => {
  return useContext(FormControlContext);
};

const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  (
    {
      children,
      className = '',
      error = false,
      disabled = false,
      required = false,
      fullWidth = false,
      margin = 'normal',
      variant = 'standard',
      size = 'md',
      ...props
    },
    ref
  ) => {
    // Generate a unique ID for the input that will be used by labels
    const inputId = useMemo(
      () => `form-control-input-${Math.random().toString(36).slice(2, 11)}`,
      []
    );

    const marginClasses = {
      none: '',
      dense: 'mb-2',
      normal: 'mb-4',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const formControlClasses = `${marginClasses[margin]} ${widthClasses} ${className}`;

    const contextValue: FormControlContextValue = {
      error,
      disabled,
      required,
      variant,
      size,
      inputId,
    };

    return (
      <FormControlContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={formControlClasses}
          {...props}
        >
          {children}
        </div>
      </FormControlContext.Provider>
    );
  }
);

FormControl.displayName = 'FormControl';

export { FormControl };
export default FormControl;
