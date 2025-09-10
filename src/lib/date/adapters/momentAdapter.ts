import moment from 'moment';
import { DateAdapter } from '../../../components/ui/DatePickers/types';

export const momentAdapter: DateAdapter = {
  now: () => new Date(),
  clone: (d) => new Date(d.getTime()),

  addMonths: (d, n) => moment(d).add(n, 'month').toDate(),
  addYears: (d, n) => moment(d).add(n, 'year').toDate(),

  startOfDay: (d) => moment(d).startOf('day').toDate(),
  endOfDay: (d) => moment(d).endOf('day').toDate(),
  startOfWeek: (d, weekStartsOn) =>
    moment(d).startOf('week').add(weekStartsOn, 'day').toDate(),

  isValid: (x) => moment(x as any).isValid(),
  isBefore: (a, b) => moment(a).isBefore(moment(b), 'day'),
  isAfter: (a, b) => moment(a).isAfter(moment(b), 'day'),
  isSameDay: (a, b) => moment(a).isSame(moment(b), 'day'),

  parse: (val, fmt) => moment(val, fmt, true).toDate(),
  format: (d, fmt) => moment(d).format(fmt),

  getYear: (d) => moment(d).year(),
  getMonth: (d) => moment(d).month(),
  getDate: (d) => moment(d).date(),
  getDay: (d) => moment(d).day(),

  setHoursMinutes: (d, h, m) =>
    moment(d).hour(h).minute(m).second(0).millisecond(0).toDate(),
};
