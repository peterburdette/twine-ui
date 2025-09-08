'use client';
import * as React from 'react';
import type { CardContextValue } from './../types';

export const CardContext = React.createContext<CardContextValue>({
  density: 'standard',
  padding: 'md',
  orientation: 'vertical',
  disabled: false,
});

export const useCard = () => React.useContext(CardContext);
