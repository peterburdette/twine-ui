import type { GridValueFormatterParams } from '../types/api';

// Number formatters
export const gridNumberFormatter = (
  params: GridValueFormatterParams
): string => {
  if (params.value == null) return '';
  return new Intl.NumberFormat().format(params.value);
};

export const gridCurrencyFormatter =
  (currency = 'USD') =>
  (params: GridValueFormatterParams): string => {
    if (params.value == null) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(params.value);
  };

export const gridPercentageFormatter = (
  params: GridValueFormatterParams
): string => {
  if (params.value == null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(params.value / 100);
};

// Date formatters
export const gridDateFormatter = (params: GridValueFormatterParams): string => {
  if (params.value == null) return '';
  const date =
    params.value instanceof Date ? params.value : new Date(params.value);
  return date.toLocaleDateString();
};

export const gridDateTimeFormatter = (
  params: GridValueFormatterParams
): string => {
  if (params.value == null) return '';
  const date =
    params.value instanceof Date ? params.value : new Date(params.value);
  return date.toLocaleString();
};

export const gridTimeFormatter = (params: GridValueFormatterParams): string => {
  if (params.value == null) return '';
  const date =
    params.value instanceof Date ? params.value : new Date(params.value);
  return date.toLocaleTimeString();
};

// String formatters
export const gridStringFormatter = (
  params: GridValueFormatterParams
): string => {
  return params.value?.toString() ?? '';
};

export const gridBooleanFormatter = (
  params: GridValueFormatterParams
): string => {
  if (params.value == null) return '';
  return params.value ? 'Yes' : 'No';
};

// Custom formatters
export const gridFileSize = (params: GridValueFormatterParams): string => {
  if (params.value == null) return '';
  const bytes = params.value;
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  );
};

export const gridPhoneFormatter = (
  params: GridValueFormatterParams
): string => {
  if (params.value == null) return '';
  const phone = params.value.toString().replace(/\D/g, '');
  const match = phone.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return params.value;
};

export const gridEmailFormatter = (
  params: GridValueFormatterParams
): string => {
  if (params.value == null) return '';
  return params.value.toString().toLowerCase();
};

export const gridUrlFormatter = (params: GridValueFormatterParams): string => {
  if (params.value == null) return '';
  const url = params.value.toString();
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return url;
  }
};

// Utility function to create custom formatter
export const createGridFormatter =
  (formatter: (value: any) => string) =>
  (params: GridValueFormatterParams): string => {
    if (params.value == null) return '';
    return formatter(params.value);
  };
