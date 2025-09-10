import { DateAdapter } from '../../components/ui/DatePickers/types';

export const vanillaAdapter: DateAdapter = {
  now: () => new Date(),
  clone: (d) => new Date(d.getTime()),
  addMonths: (d, n) => {
    const x = new Date(d);
    const day = x.getDate();
    x.setDate(1);
    x.setMonth(x.getMonth() + n);
    const last = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate();
    x.setDate(Math.min(day, last));
    return x;
  },
  addYears: (d, n) => {
    const x = new Date(d);
    x.setFullYear(x.getFullYear() + n);
    return x;
  },
  startOfDay: (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  },
  endOfDay: (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  },
  startOfWeek: (d, weekStartsOn) => {
    const x = new Date(d);
    const diff = (x.getDay() - weekStartsOn + 7) % 7;
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  },
  isValid: (v) => v instanceof Date && !Number.isNaN(v.getTime()),
  isBefore: (a, b) => a.getTime() < b.getTime(),
  isAfter: (a, b) => a.getTime() > b.getTime(),
  isSameDay: (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate(),
  parse: (val) => new Date(val),
  format: (d) => d.toLocaleString(),
  getYear: (d) => d.getFullYear(),
  getMonth: (d) => d.getMonth(),
  getDate: (d) => d.getDate(),
  getDay: (d) => d.getDay(),
  setHoursMinutes: (d, h, m) => {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x;
  },
};
