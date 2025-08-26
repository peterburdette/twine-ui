'use client';

import * as React from 'react';
import { useFormControl } from '../FormControl/FormControl';

export const FormErrorText: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  role = 'alert',
  ...props
}) => {
  const fc = useFormControl();
  // Only render when error is true
  if (!fc?.error || !fc.errorId) return null;

  return (
    <div
      id={fc.errorId}
      role={role}
      className={`text-sm text-red-600 ${className}`}
      {...props}
    />
  );
};

export default FormErrorText;
