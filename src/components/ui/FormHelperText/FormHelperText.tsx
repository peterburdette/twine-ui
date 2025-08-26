'use client';

import * as React from 'react';
import { useFormControl } from '../FormControl/FormControl';

export const FormHelperText: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  ...props
}) => {
  const fc = useFormControl();
  if (!fc?.descriptionId) return null;

  return (
    <div
      id={fc.descriptionId}
      className={`text-sm text-gray-500 ${className}`}
      {...props}
    />
  );
};

export default FormHelperText;
