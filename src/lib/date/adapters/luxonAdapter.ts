import { DateTime } from 'luxon';
import { DateAdapter } from '../../../components/ui/DatePickers/types';

export const luxonAdapter: DateAdapter = {
  now: () => new Date(),
  clone: (d) => new Date(d.getTime()),

  addMonths: (d, n) => DateTime.fromJSDate(d).plus({ months: n }).toJSDate(),
  addYears: (d, n) => DateTime.fromJSDate(d).plus({ years: n }).toJSDate(),

  startOfDay: (d) => DateTime.fromJSDate(d).startOf('day').toJSDate(),
  endOfDay: (d) => DateTime.fromJSDate(d).endOf('day').toJSDate(),
  startOfWeek: (d, weekStartsOn) =>
    DateTime.fromJSDate(d)
      .startOf('week')
      .plus({ days: weekStartsOn })
      .toJSDate(),

  isValid: (x) => DateTime.fromJSDate(x as any).isValid,
  isBefore: (a, b) => DateTime.fromJSDate(a) < DateTime.fromJSDate(b),
  isAfter: (a, b) => DateTime.fromJSDate(a) > DateTime.fromJSDate(b),
  isSameDay: (a, b) =>
    DateTime.fromJSDate(a).hasSame(DateTime.fromJSDate(b), 'day'),

  parse: (val, fmt) => DateTime.fromFormat(val, fmt).toJSDate(),
  format: (d, fmt) => DateTime.fromJSDate(d).toFormat(fmt),

  getYear: (d) => DateTime.fromJSDate(d).year,
  getMonth: (d) => DateTime.fromJSDate(d).month - 1, // Luxon month is 1–12
  getDate: (d) => DateTime.fromJSDate(d).day,
  getDay: (d) => DateTime.fromJSDate(d).weekday % 7, // convert Mon=1..Sun=7 → 0..6

  setHoursMinutes: (d, h, m) =>
    DateTime.fromJSDate(d)
      .set({ hour: h, minute: m, second: 0, millisecond: 0 })
      .toJSDate(),
};
