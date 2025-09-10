export interface DateTimeRange {
  start: Date | undefined;
  end: Date | undefined;
}

export interface DateAdapter {
  now: () => Date;
  clone: (d: Date) => Date;
  addMonths: (d: Date, n: number) => Date;
  addYears: (d: Date, n: number) => Date;
  startOfDay: (d: Date) => Date;
  endOfDay: (d: Date) => Date;
  startOfWeek: (d: Date, weekStartsOn: number) => Date;
  isValid: (d: unknown) => boolean;
  isBefore: (a: Date, b: Date) => boolean;
  isAfter: (a: Date, b: Date) => boolean;
  isSameDay: (a: Date, b: Date) => boolean;
  parse: (value: string, fmt: string, ref: Date) => Date;
  format: (d: Date, fmt: string) => string;
  getYear: (d: Date) => number;
  getMonth: (d: Date) => number;
  getDate: (d: Date) => number;
  getDay: (d: Date) => number;
  setHoursMinutes: (d: Date, hours: number, minutes: number) => Date;
}
