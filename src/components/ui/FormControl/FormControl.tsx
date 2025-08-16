'use client';

import { forwardRef, createContext, useContext, useMemo } from 'react';
import { cn } from '../../../lib/utils';

export interface FormControlProps extends React.HTMLAttributes<HTMLDivElement> {
  error?: boolean;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  id?: string; // allow overriding inputId
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
      id,
      ...props
    },
    ref
  ) => {
    // Stable ID for linking <label htmlFor> with inputs
    const inputId = useMemo(
      () =>
        id ?? `form-control-input-${Math.random().toString(36).slice(2, 11)}`,
      [id]
    );

    const marginClasses = {
      none: '',
      dense: 'mb-2',
      normal: 'mb-4',
    };

    const widthClasses = fullWidth ? 'w-full' : '';

    const formControlClasses = cn(
      marginClasses[margin],
      widthClasses,
      className
    );

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
