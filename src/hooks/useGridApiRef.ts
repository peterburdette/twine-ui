'use client';

import { useRef } from 'react';
import type { GridApiRef, UseGridApiRefReturn } from '../types/api';

export const useGridApiRef = (): UseGridApiRefReturn => {
  const apiRef = useRef<GridApiRef>({} as GridApiRef);

  return apiRef as UseGridApiRefReturn;
};

// Utility function to create API ref
export const createGridApiRef = (): { current: GridApiRef } => {
  return { current: {} as GridApiRef };
};
