import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { DateAdapter } from '../../../components/ui/DatePickers/types';

// enable tokens like "Do", "YYYY-MM-DD", etc.
dayjs.extend(advancedFormat);
dayjs.extend(customParseFormat);

export const dayjsAdapter: DateAdapter = {
  now: () => new Date(),
  clone: (d) => new Date(d.getTime()),

  addMonths: (d, n) => dayjs(d).add(n, 'month').toDate(),
  addYears: (d, n) => dayjs(d).add(n, 'year').toDate(),

  startOfDay: (d) => dayjs(d).startOf('day').toDate(),
  endOfDay: (d) => dayjs(d).endOf('day').toDate(),
  startOfWeek: (d, weekStartsOn) =>
    dayjs(d).startOf('week').add(weekStartsOn, 'day').toDate(),

  isValid: (x) => dayjs(x as any).isValid(),
  isBefore: (a, b) => dayjs(a).isBefore(dayjs(b), 'day'),
  isAfter: (a, b) => dayjs(a).isAfter(dayjs(b), 'day'),
  isSameDay: (a, b) => dayjs(a).isSame(dayjs(b), 'day'),

  parse: (val, fmt) => dayjs(val, fmt, true).toDate(),
  format: (d, fmt) => dayjs(d).format(fmt),

  getYear: (d) => dayjs(d).year(),
  getMonth: (d) => dayjs(d).month(),
  getDate: (d) => dayjs(d).date(),
  getDay: (d) => dayjs(d).day(),

  setHoursMinutes: (d, h, m) =>
    dayjs(d).hour(h).minute(m).second(0).millisecond(0).toDate(),
};
