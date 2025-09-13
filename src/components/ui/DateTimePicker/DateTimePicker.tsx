'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

import Button from '../Button';
import Input from '../Input/Input';
import Select from '../Select/Select';
import Popover from '../Popover/Popover';

import { DEFAULT_MONTHS, DEFAULT_DAYS, ROWS_X_COLS } from './constants';
import type { DateAdapter, DateTimeRange } from '../../../lib/date/types';
import { vanillaAdapter } from '../../../lib/date';

export interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;

  rangeValue?: DateTimeRange;
  onRangeChange?: (range: DateTimeRange) => void;
  isRange?: boolean;

  placeholder?: string;
  rangePlaceholder?: { start?: string; end?: string };
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  showTime?: boolean;
  timeFormat?: '12' | '24';
  dateFormat?: string;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
  inputSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?:
    | 'default'
    | 'filled'
    | 'outlined'
    | 'ghost'
    | 'underline'
    | 'floating'
    | 'inset';

  dateAdapter?: DateAdapter;
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  localeMonthNames?: string[];
  localeWeekdayShort?: string[];

  open?: boolean;
  onOpenChange?: (open: boolean) => void;

  enableQuickActions?: boolean; // Today/Clear/Done
  readOnly?: boolean;
  ariaLabel?: string;

  /** Prevents SSR/CSR mismatch when no value is provided and you rely on "now". */
  deferInitialRender?: boolean;
}

const STABLE_EPOCH = new Date(Date.UTC(2000, 0, 1, 0, 0, 0)); // SSR-safe sentinel

/** Map extended input sizes → nearest supported control size ('sm' | 'md' | 'lg'). */
const mapToControlSize = (s: NonNullable<DateTimePickerProps['inputSize']>) =>
  s === 'xs' ? 'sm' : s === 'xl' ? 'lg' : s;

/** If your Input supports only 'sm'|'md'|'lg', map the same way. */
const mapToInputSize = mapToControlSize;

/** Map DateTimePicker variant → Select's supported variants */
type SelectVariant = 'default' | 'filled' | 'outlined' | 'ghost' | 'underline';
const mapToSelectVariant = (
  v: NonNullable<DateTimePickerProps['variant']>
): SelectVariant =>
  v === 'floating'
    ? 'outlined'
    : v === 'inset'
    ? 'filled'
    : (v as SelectVariant);

/** Lucide numeric pixels for 'sm' | 'md' | 'lg' */
const iconPxFor = (s: 'sm' | 'md' | 'lg') =>
  s === 'sm' ? 16 : s === 'md' ? 20 : 24;

const getInitialTimeFromDate = (d: Date | undefined, tf: '12' | '24') => {
  const hours = d ? d.getHours() : 12;
  return {
    hours: tf === '12' ? hours % 12 || 12 : hours,
    minutes: d ? d.getMinutes() : 0,
    period: d && d.getHours() >= 12 ? ('PM' as const) : ('AM' as const),
  };
};

const DateTimePicker = ({
  value,
  onChange,
  rangeValue,
  onRangeChange,
  isRange = false,
  placeholder = 'Select date and time',
  rangePlaceholder,
  disabled = false,
  minDate,
  maxDate,
  disabledDates = [],
  showTime = true,
  timeFormat = '12',
  dateFormat = showTime ? 'MMM dd, yyyy HH:mm' : 'MMM dd, yyyy',
  label,
  error,
  required = false,
  className,
  inputSize = 'md',
  variant = 'default',
  dateAdapter = vanillaAdapter,
  weekStartsOn = 0,
  localeMonthNames = DEFAULT_MONTHS,
  localeWeekdayShort = DEFAULT_DAYS as unknown as string[],
  open: controlledOpen,
  onOpenChange,
  enableQuickActions = true,
  readOnly = false,
  ariaLabel,
  deferInitialRender = true,
}: DateTimePickerProps) => {
  // mount flag (avoid SSR date formatting mismatch)
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // a11y ids
  const inputId = React.useId();
  const descrId = React.useId();
  const gridId = React.useId();

  // open state
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (o: boolean) =>
    onOpenChange ? onOpenChange(o) : setInternalOpen(o);

  // initial base for view
  const initialViewBase =
    value && dateAdapter.isValid(value)
      ? value
      : deferInitialRender
      ? STABLE_EPOCH
      : dateAdapter.now();

  const [viewDate, setViewDate] = React.useState<Date>(() => initialViewBase);

  // align viewDate to now after mount if deferred and no value provided
  React.useEffect(() => {
    if (!mounted) return;
    if (!value && deferInitialRender) {
      setViewDate(dateAdapter.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const [timeValue, setTimeValue] = React.useState(() =>
    getInitialTimeFromDate(
      value && dateAdapter.isValid(value)
        ? value
        : deferInitialRender
        ? undefined
        : dateAdapter.now(),
      timeFormat
    )
  );

  // sync time when controlled value changes
  React.useEffect(() => {
    if (value && dateAdapter.isValid(value)) {
      setTimeValue(getInitialTimeFromDate(value, timeFormat));
      setViewDate(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, timeFormat]);

  // formatted input value
  const [inputValue, setInputValue] = React.useState<string>(() => {
    if (!deferInitialRender) {
      return value && dateAdapter.isValid(value)
        ? dateAdapter.format(value, dateFormat)
        : '';
    }
    return '';
  });

  React.useEffect(() => {
    if (!mounted && deferInitialRender) return;
    if (value && dateAdapter.isValid(value)) {
      setInputValue(dateAdapter.format(value, dateFormat));
    } else {
      setInputValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, value, dateFormat]);

  // view mode
  const [view, setView] = React.useState<'day' | 'month' | 'year'>('day');

  // temp range cache
  const [tempRange, setTempRange] = React.useState<DateTimeRange>({
    start: undefined,
    end: undefined,
  });

  // parsing free-typed input
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    try {
      const parsed = dateAdapter.parse(newValue, dateFormat, dateAdapter.now());
      if (dateAdapter.isValid(parsed)) onChange?.(parsed);
    } catch {
      /* ignore */
    }
  };

  // predicates
  const isDateDisabled = (date: Date) => {
    if (minDate && dateAdapter.isBefore(date, dateAdapter.startOfDay(minDate)))
      return true;
    if (maxDate && dateAdapter.isAfter(date, dateAdapter.endOfDay(maxDate)))
      return true;
    return disabledDates.some((d) => dateAdapter.isSameDay(date, d));
  };
  const isInTempRange = (date: Date) =>
    isRange &&
    tempRange.start &&
    tempRange.end &&
    dateAdapter.isAfter(date, tempRange.start) &&
    dateAdapter.isBefore(date, tempRange.end);
  const isStart = (date: Date) =>
    isRange &&
    !!tempRange.start &&
    dateAdapter.isSameDay(date, tempRange.start);
  const isEnd = (date: Date) =>
    isRange && !!tempRange.end && dateAdapter.isSameDay(date, tempRange.end);
  const isToday = (date: Date) =>
    dateAdapter.isSameDay(date, dateAdapter.now());

  // commit single date
  const commitSingleDate = (date: Date) => {
    if (showTime) {
      const is12 = timeFormat === '12';
      const baseHours = Number(timeValue.hours) % (is12 ? 12 : 24);
      const hours = is12
        ? baseHours + (timeValue.period === 'PM' ? 12 : 0)
        : baseHours;
      const next = dateAdapter.setHoursMinutes(
        date,
        hours,
        Number(timeValue.minutes)
      );
      onChange?.(next);
    } else {
      onChange?.(date);
      setOpen(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    if (isRange) {
      if (!tempRange.start) {
        setTempRange({ start: date, end: undefined });
      } else if (!tempRange.end && dateAdapter.isAfter(date, tempRange.start)) {
        setTempRange({ ...tempRange, end: date });
        onRangeChange?.({ start: tempRange.start, end: date });
        setOpen(false);
      } else {
        setTempRange({ start: date, end: undefined });
      }
      return;
    }
    commitSingleDate(date);
  };

  // keyboard nav
  const [activeDay, setActiveDay] = React.useState<Date>(() =>
    value && dateAdapter.isValid(value) ? value : initialViewBase
  );
  const moveActive = (days: number) => {
    const d = new Date(activeDay);
    d.setDate(d.getDate() + days);
    setActiveDay(d);
  };
  const onGridKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (view !== 'day') return;
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveActive(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActive(-7);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveActive(7);
        break;
      case 'Home':
        e.preventDefault();
        setActiveDay(
          new Date(
            dateAdapter.getYear(viewDate),
            dateAdapter.getMonth(viewDate),
            1
          )
        );
        break;
      case 'End':
        e.preventDefault();
        setActiveDay(
          new Date(
            dateAdapter.getYear(viewDate),
            dateAdapter.getMonth(viewDate) + 1,
            0
          )
        );
        break;
      case 'PageUp':
        e.preventDefault();
        setViewDate(dateAdapter.addMonths(viewDate, -1));
        break;
      case 'PageDown':
        e.preventDefault();
        setViewDate(dateAdapter.addMonths(viewDate, 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!isDateDisabled(activeDay)) handleDateSelect(activeDay);
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  // header nav
  const goPrev = () => {
    if (view === 'day') setViewDate(dateAdapter.addMonths(viewDate, -1));
    else if (view === 'month') setViewDate(dateAdapter.addYears(viewDate, -1));
    else setViewDate(dateAdapter.addYears(viewDate, -10));
  };
  const goNext = () => {
    if (view === 'day') setViewDate(dateAdapter.addMonths(viewDate, 1));
    else if (view === 'month') setViewDate(dateAdapter.addYears(viewDate, 1));
    else setViewDate(dateAdapter.addYears(viewDate, 10));
  };

  // ---------- icon sizing (mapped 'xs|sm|md|lg|xl' → 'sm|md|lg') ----------
  const inputVisualSize = mapToInputSize(inputSize);
  const inputIconPx = iconPxFor(inputVisualSize); // Calendar icon in the input
  const controlIconPx = inputIconPx; // Chevron + Clock icons in popover

  // calendar
  const renderCalendar = () => {
    const year = dateAdapter.getYear(viewDate);
    const month = dateAdapter.getMonth(viewDate);

    if (view === 'year') {
      const startYear = Math.floor(year / 10) * 10;
      const years = Array.from({ length: 12 }, (_, i) => startYear + i - 1);
      return (
        <div
          className="grid grid-cols-3 gap-2 p-2"
          role="listbox"
          aria-label="Select year"
        >
          {years.map((y) => (
            <Button
              key={y}
              size="sm"
              variant={y === year ? 'default' : 'ghost'}
              onClick={() => {
                setViewDate(new Date(y, month, 1));
                setView('month');
              }}
              aria-selected={y === year}
            >
              {y}
            </Button>
          ))}
        </div>
      );
    }

    if (view === 'month') {
      return (
        <div
          className="grid grid-cols-3 gap-2 p-2"
          role="listbox"
          aria-label="Select month"
        >
          {localeMonthNames.map((name, i) => (
            <Button
              key={name}
              size="sm"
              variant={i === month ? 'default' : 'ghost'}
              onClick={() => {
                setViewDate(new Date(year, i, 1));
                setView('day');
              }}
              aria-selected={i === month}
              className="text-xs"
            >
              {name.slice(0, 3)}
            </Button>
          ))}
        </div>
      );
    }

    // day grid
    const firstOfMonth = new Date(year, month, 1);
    const gridStart = dateAdapter.startOfWeek(firstOfMonth, weekStartsOn);
    const cells: React.ReactNode[] = [];

    for (let i = 0; i < ROWS_X_COLS; i++) {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + i);

      const inThisMonth = date.getMonth() === month;
      const selected =
        value &&
        dateAdapter.isValid(value) &&
        dateAdapter.isSameDay(date, value);
      const inRange = isInTempRange(date);
      const start = isStart(date);
      const end = isEnd(date);
      const disabledDay = isDateDisabled(date);

      const lockHover = disabledDay || selected || inRange || start || end;

      const label = mounted ? dateAdapter.format(date, 'PPPP') : '';

      cells.push(
        <Button
          key={date.toISOString()}
          type="button"
          role="gridcell"
          aria-selected={!!selected}
          aria-current={isToday(date) ? 'date' : undefined}
          aria-disabled={disabledDay || undefined}
          tabIndex={
            disabledDay ? -1 : dateAdapter.isSameDay(date, activeDay) ? 0 : -1
          }
          onFocus={() => !disabledDay && setActiveDay(date)}
          onClick={() => !disabledDay && handleDateSelect(date)}
          size="icon"
          variant={lockHover ? 'unstyled' : 'ghost'}
          className={cn(
            'h-8 w-8 p-0 rounded-md text-sm flex items-center justify-center',
            !inThisMonth && 'text-gray-400',
            disabledDay && 'cursor-default opacity-50',
            selected && 'bg-blue-600 text-white',
            (start || end) && 'bg-blue-600 text-white',
            inRange && 'bg-gray-900 text-white/90',
            !lockHover && 'hover:bg-gray-100'
          )}
        >
          <span
            className="sr-only"
            suppressHydrationWarning
          >
            {label}
          </span>
          <span aria-hidden="true">{dateAdapter.getDate(date)}</span>
        </Button>
      );
    }

    // weekday header respecting weekStartsOn
    const weekdayOrder = Array.from(
      { length: 7 },
      (_, i) => (i + weekStartsOn) % 7
    );

    return (
      <div className="p-2">
        <div
          className="grid grid-cols-7 gap-1 mb-2"
          aria-hidden="true"
        >
          {weekdayOrder.map((d) => (
            <div
              key={d}
              className="h-8 w-8 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {localeWeekdayShort[d]}
            </div>
          ))}
        </div>
        <div
          id={gridId}
          role="grid"
          aria-label={
            mounted ? dateAdapter.format(viewDate, 'MMMM yyyy') : 'Calendar'
          }
          className="grid grid-cols-7 gap-1 outline-none"
          onKeyDown={onGridKeyDown}
          suppressHydrationWarning
        >
          {cells}
        </div>
      </div>
    );
  };

  // time picker
  const renderTime = () => {
    if (!showTime) return null;

    const hours =
      timeFormat === '12'
        ? Array.from({ length: 12 }, (_, i) => i + 1)
        : Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const onTimeChange = (type: 'hours' | 'minutes' | 'period', v: string) => {
      const next = {
        ...timeValue,
        [type]: type === 'period' ? v : Number.parseInt(v),
      };
      setTimeValue(next);

      const base = value && dateAdapter.isValid(value) ? value : viewDate;
      const is12 = timeFormat === '12';
      const baseHours = Number(next.hours) % (is12 ? 12 : 24);
      const hours24 = is12
        ? baseHours + (next.period === 'PM' ? 12 : 0)
        : baseHours;

      const updated = dateAdapter.setHoursMinutes(
        base,
        hours24,
        Number(next.minutes)
      );
      onChange?.(updated);
    };

    // Use the shared inputSize/variant for the time controls as well (mapped)
    const controlSize = mapToControlSize(inputSize);
    const controlVariant = mapToSelectVariant(variant);

    return (
      <>
        <div className="border-t" />
        <div
          className="p-3 space-y-3"
          aria-label="Time selector"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock
              size={controlIconPx}
              className="block shrink-0"
              aria-hidden="true"
            />
            Time
          </div>
          <div className="flex items-center gap-2">
            <Select
              options={hours.map((h) => ({
                value: String(h),
                label: String(h).padStart(2, '0'),
              }))}
              value={String(timeValue.hours)}
              onChange={(v) => onTimeChange('hours', v)}
              size={controlSize}
              variant={controlVariant}
              fixedTriggerWidth={64}
              aria-label="Hours"
            />
            <span aria-hidden>:</span>
            <Select
              options={minutes.map((m) => ({
                value: String(m),
                label: String(m).padStart(2, '0'),
              }))}
              value={String(timeValue.minutes)}
              onChange={(v) => onTimeChange('minutes', v)}
              size={controlSize}
              variant={controlVariant}
              fixedTriggerWidth={64}
              aria-label="Minutes"
            />
            {timeFormat === '12' && (
              <Select
                options={[
                  { value: 'AM', label: 'AM' },
                  { value: 'PM', label: 'PM' },
                ]}
                value={timeValue.period}
                onChange={(v) => onTimeChange('period', v)}
                size={controlSize}
                variant={controlVariant}
                fixedTriggerWidth={72}
                aria-label="AM or PM"
              />
            )}
          </div>
        </div>
      </>
    );
  };

  // quick actions
  const renderQuick = () => {
    if (!enableQuickActions) return null;
    return (
      <div className="border-t p-2 flex items-center justify-between gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            const today = dateAdapter.now();
            setViewDate(today);
            if (!isRange) commitSingleDate(today);
          }}
        >
          Today
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (isRange) {
                setTempRange({ start: undefined, end: undefined });
                onRangeChange?.({ start: undefined, end: undefined });
              } else {
                onChange?.(undefined);
              }
              setInputValue('');
            }}
          >
            Clear
          </Button>
          {showTime && (
            <Button
              size="sm"
              onClick={() => setOpen(false)}
            >
              Done
            </Button>
          )}
        </div>
      </div>
    );
  };

  // header
  const Header = (
    <div className="flex items-center justify-between p-2 border-b">
      <Button
        variant="ghost"
        size="sm"
        onClick={goPrev}
        aria-label="Previous"
      >
        <ChevronLeft
          size={controlIconPx}
          className="block shrink-0"
          aria-hidden="true"
        />
      </Button>
      <Button
        id={`${inputId}-heading`}
        variant="ghost"
        size="sm"
        onClick={() =>
          setView(view === 'day' ? 'month' : view === 'month' ? 'year' : 'year')
        }
        className="font-medium"
        aria-live="polite"
        suppressHydrationWarning
      >
        {mounted && view === 'day' && dateAdapter.format(viewDate, 'MMMM yyyy')}
        {mounted && view === 'month' && dateAdapter.getYear(viewDate)}
        {mounted &&
          view === 'year' &&
          `${Math.floor(dateAdapter.getYear(viewDate) / 10) * 10}-${
            Math.floor(dateAdapter.getYear(viewDate) / 10) * 10 + 9
          }`}
        {!mounted && '\u00A0'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={goNext}
        aria-label="Next"
      >
        <ChevronRight
          size={controlIconPx}
          className="block shrink-0"
          aria-hidden="true"
        />
      </Button>
    </div>
  );

  // popover content
  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${inputId}-heading`}
      className="w-[280px] bg-white border border-gray-200 rounded-md shadow-md"
    >
      {Header}
      {renderCalendar()}
      {renderTime()}
      {renderQuick()}
    </div>
  );

  // When using floating/inset in your Input, avoid duplicating the visible label
  const usingInternalLabel = variant === 'floating' || variant === 'inset';
  const externalLabel = label && !usingInternalLabel ? label : undefined;

  // For floating/inset variants, the label lives inside the input.
  const inputInternalLabel = usingInternalLabel
    ? label ?? placeholder ?? 'Select date and time'
    : undefined;

  // Keep :placeholder-shown working for floating/inset
  const inputPlaceholder = usingInternalLabel ? ' ' : placeholder ?? '';

  return (
    <div className={cn('space-y-2', className)}>
      {externalLabel && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            required && "after:content-['*'] after:text-red-600 after:ml-1"
          )}
        >
          {externalLabel}
        </label>
      )}

      <Popover
        trigger="click"
        open={open}
        onOpenChange={setOpen}
        content={content}
        placement="bottom"
        offset={8}
      >
        <div
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? gridId : undefined}
          aria-haspopup="dialog"
          className="relative"
        >
          <Input
            id={inputId}
            value={inputValue}
            onChange={onInputChange}
            placeholder={inputPlaceholder}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={!!error || undefined}
            aria-required={required || undefined}
            aria-label={
              !externalLabel && !inputInternalLabel
                ? ariaLabel ?? 'Date time input'
                : undefined
            }
            aria-describedby={error ? descrId : undefined}
            endIcon={
              <CalendarIcon
                size={inputIconPx}
                className="block shrink-0"
                aria-hidden="true"
              />
            }
            suppressHydrationWarning
            inputSize={inputVisualSize}
            variant={variant}
            label={inputInternalLabel}
            error={error}
            required={required}
          />
        </div>
      </Popover>

      {error && (
        <p
          id={descrId}
          className="text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
};

DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker };
export default DateTimePicker;
