import type { GridValueGetterParams } from '../types/api';

// Basic value getters
export const gridStringValueGetter = (
  params: GridValueGetterParams
): string => {
  return params.value?.toString() ?? '';
};

export const gridNumberValueGetter = (
  params: GridValueGetterParams
): number => {
  const num = Number(params.value);
  return isNaN(num) ? 0 : num;
};

export const gridDateValueGetter = (
  params: GridValueGetterParams
): Date | null => {
  if (params.value == null) return null;
  if (params.value instanceof Date) return params.value;
  const date = new Date(params.value);
  return isNaN(date.getTime()) ? null : date;
};

export const gridBooleanValueGetter = (
  params: GridValueGetterParams
): boolean => {
  if (typeof params.value === 'boolean') return params.value;
  if (typeof params.value === 'string') {
    return params.value.toLowerCase() === 'true' || params.value === '1';
  }
  return Boolean(params.value);
};

// Computed value getters
export const gridCombinedValueGetter =
  (fields: string[], separator = ' ') =>
  (params: GridValueGetterParams): string => {
    return fields
      .map((field) => params.row[field])
      .filter((value) => value != null && value !== '')
      .join(separator);
  };

export const gridFullNameValueGetter = (
  params: GridValueGetterParams
): string => {
  const firstName = params.row.firstName || '';
  const lastName = params.row.lastName || '';
  return `${firstName} ${lastName}`.trim();
};

export const gridAgeFromBirthDateValueGetter = (
  params: GridValueGetterParams
): number => {
  if (!params.value) return 0;
  const birthDate = new Date(params.value);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
};

export const gridCalculatedValueGetter =
  (calculation: (row: any) => any) =>
  (params: GridValueGetterParams): any => {
    return calculation(params.row);
  };

// Nested object value getter
export const gridNestedValueGetter =
  (path: string) =>
  (params: GridValueGetterParams): any => {
    const keys = path.split('.');
    let value = params.row;
    for (const key of keys) {
      if (value == null) return null;
      value = value[key];
    }
    return value;
  };

// Array value getters
export const gridArrayLengthValueGetter = (
  params: GridValueGetterParams
): number => {
  return Array.isArray(params.value) ? params.value.length : 0;
};

export const gridArrayJoinValueGetter =
  (separator = ', ') =>
  (params: GridValueGetterParams): string => {
    return Array.isArray(params.value) ? params.value.join(separator) : '';
  };

// Conditional value getter
export const gridConditionalValueGetter =
  (
    condition: (params: GridValueGetterParams) => boolean,
    trueValue: any,
    falseValue: any
  ) =>
  (params: GridValueGetterParams): any => {
    return condition(params) ? trueValue : falseValue;
  };

// Lookup value getter
export const gridLookupValueGetter =
  (lookupMap: Record<string, any>) =>
  (params: GridValueGetterParams): any => {
    return lookupMap[params.value] ?? params.value;
  };
