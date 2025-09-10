import {
  format as fnsFormat,
  isValid as fnsIsValid,
  parse as fnsParse,
  startOfDay as fnsStartOfDay,
  endOfDay as fnsEndOfDay,
  isBefore as fnsIsBefore,
  isAfter as fnsIsAfter,
  addMonths as fnsAddMonths,
  addYears as fnsAddYears,
  startOfWeek as fnsStartOfWeek,
  differenceInCalendarDays as fnsDiffDays,
} from 'date-fns';
import { DateAdapter } from '../types';

/**
 * Coerce our public `number` (0..6) into date-fns' branded `Day` type.
 * We keep Twine UI's DateAdapter lib-agnostic; only this optional adapter knows about `Day`.
 */
const toDateFnsDay = (n: number) => n as unknown as import('date-fns').Day;

export const dateFnsAdapter: DateAdapter = {
  now: () => new Date(),
  clone: (d) => new Date(d.getTime()),

  addMonths: fnsAddMonths,
  addYears: fnsAddYears,

  startOfDay: fnsStartOfDay,
  endOfDay: fnsEndOfDay,

  startOfWeek: (d, weekStartsOn) =>
    fnsStartOfWeek(d, { weekStartsOn: toDateFnsDay(weekStartsOn) }),

  isValid: (d) => d instanceof Date && fnsIsValid(d),
  isBefore: fnsIsBefore,
  isAfter: fnsIsAfter,

  // Using calendar-day diff avoids time-of-day pitfalls
  isSameDay: (a, b) => fnsDiffDays(a, b) === 0,

  parse: (val, fmt, ref) => fnsParse(val, fmt, ref),
  format: (d, fmt) => fnsFormat(d, fmt),

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

export default dateFnsAdapter;
