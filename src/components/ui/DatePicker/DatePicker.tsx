'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';

import { cn } from '../../../lib/utils';
import Button from '../Button';
import Input from '../Input/Input';
import Popover from '../Popover/Popover';

import { DEFAULT_MONTHS, DEFAULT_DAYS, ROWS_X_COLS } from './constants';
import { DateAdapter } from '../../../lib/date/types';
import { vanillaAdapter } from '../../../lib/date';

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;

  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  dateFormat?: string;

  label?: string;
  error?: string;
  required?: boolean;
  className?: string;

  /** Visual size for the input; mapped to nearest size for inner controls */
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

  enableQuickActions?: boolean; // Today / Clear
  readOnly?: boolean;
  ariaLabel?: string;

  /** Prevents SSR/CSR mismatch when no value is provided and you rely on "now". */
  deferInitialRender?: boolean;
}

const STABLE_EPOCH = new Date(Date.UTC(2000, 0, 1, 0, 0, 0)); // SSR-safe sentinel

// Force month/year without time regardless of adapter behavior
const formatMonthYear = (d: Date) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    // Safe fallback
    const month = d.toLocaleString('en-US', { month: 'long' });
    return `${month} ${d.getFullYear()}`;
  }
};

const formatYearOnly = (d: Date) => String(d.getFullYear());

/** Map extended input sizes → nearest supported input size ('sm'|'md'|'lg') */
const mapToInputSize = (s: NonNullable<DatePickerProps['inputSize']>) =>
  s === 'xs' ? 'sm' : s === 'xl' ? 'lg' : s;

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,

  placeholder = 'Select date',
  disabled = false,
  minDate,
  maxDate,
  disabledDates = [],
  dateFormat = 'MMM dd, yyyy',

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
}) => {
  // --- SSR hydration guard (avoid formatting "now" on the server) ---
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // a11y ids
  const inputId = React.useId();
  const descrId = React.useId();
  const gridId = React.useId();

  // popover state (controlled/uncontrolled)
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (o: boolean) =>
    onOpenChange ? onOpenChange(o) : setInternalOpen(o);

  // view date (month being displayed)
  const initialViewBase =
    value && dateAdapter.isValid(value)
      ? value
      : deferInitialRender
      ? STABLE_EPOCH
      : dateAdapter.now();

  const [viewDate, setViewDate] = React.useState<Date>(() => initialViewBase);

  // align to now after mount, if deferring
  React.useEffect(() => {
    if (!mounted) return;
    if (!value && deferInitialRender) {
      setViewDate(dateAdapter.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // ---- DATE-ONLY formatter (never show time in input) ----
  const formatDateOnly = (d?: Date) => {
    if (!d || !dateAdapter.isValid(d)) return '';
    const out = dateAdapter.format(d, dateFormat);
    // If adapter output accidentally includes time, fallback to a safe date-only format
    if (/[0-9]:[0-9]|AM|PM|GMT|T\d{2}:/.test(out)) {
      try {
        return new Intl.DateTimeFormat(undefined, {
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        }).format(d);
      } catch {
        return d.toDateString();
      }
    }
    return out;
  };

  // formatted input value (SSR-safe)
  const [inputValue, setInputValue] = React.useState<string>(() => {
    if (!deferInitialRender) {
      return formatDateOnly(value);
    }
    return '';
  });

  React.useEffect(() => {
    if (!mounted && deferInitialRender) return;
    if (value && dateAdapter.isValid(value)) {
      setInputValue(formatDateOnly(value)); // ensure date-only text
      setViewDate(value);
    } else {
      setInputValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, value, dateFormat]);

  // view mode: day/month/year
  const [view, setView] = React.useState<'day' | 'month' | 'year'>('day');

  // keyboard focus day
  const [activeDay, setActiveDay] = React.useState<Date>(() =>
    value && dateAdapter.isValid(value) ? value : initialViewBase
  );

  // ---- parsing free-typed input ----
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    try {
      const parsed = dateAdapter.parse(newValue, dateFormat, dateAdapter.now());
      if (dateAdapter.isValid(parsed))
        onChange?.(dateAdapter.startOfDay(parsed)); // normalize to date-only
    } catch {
      /* ignore */
    }
  };

  // ---- predicates ----
  const isDateDisabled = (date: Date) => {
    if (minDate && dateAdapter.isBefore(date, dateAdapter.startOfDay(minDate)))
      return true;
    if (maxDate && dateAdapter.isAfter(date, dateAdapter.endOfDay(maxDate)))
      return true;
    return disabledDates.some((d) => dateAdapter.isSameDay(date, d));
  };
  const isToday = (date: Date) =>
    dateAdapter.isSameDay(date, dateAdapter.now());

  // ---- select a day ----
  const handleDateSelect = (date: Date) => {
    onChange?.(dateAdapter.startOfDay(date)); // ensure date-only
    setOpen(false);
  };

  // ---- keyboard navigation within day view ----
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

  // ---- header nav ----
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

  // ---- calendar body ----
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
      const disabledDay = isDateDisabled(date);

      const lockHover = disabledDay || selected;
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

  // ---- quick actions ----
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
            onChange?.(dateAdapter.startOfDay(today)); // date-only
          }}
        >
          Today
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange?.(undefined);
              setInputValue('');
            }}
          >
            Clear
          </Button>
        </div>
      </div>
    );
  };

  // ---- header ----
  const Header = (
    <div className="flex items-center justify-between p-2 border-b">
      <Button
        variant="ghost"
        size="sm"
        onClick={goPrev}
        aria-label="Previous"
      >
        <ChevronLeft
          className="h-4 w-4"
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
        {mounted && view === 'day' && formatMonthYear(viewDate)}
        {mounted && view === 'month' && formatYearOnly(viewDate)}
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
          className="h-4 w-4"
          aria-hidden="true"
        />
      </Button>
    </div>
  );

  // ---- popover content ----
  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${inputId}-heading`}
      className="w-[280px] bg-white border border-gray-200 rounded-md shadow-md"
    >
      {Header}
      {renderCalendar()}
      {renderQuick()}
    </div>
  );

  // map extended sizes to your Input's supported sizes
  const inputVisualSize = mapToInputSize(inputSize);

  // internal vs external label (for floating/inset)
  const usingInternalLabel = variant === 'floating' || variant === 'inset';
  const externalLabel = label && !usingInternalLabel ? label : undefined;
  const inputInternalLabel = usingInternalLabel ? label : undefined;

  // inject a single-space placeholder for floating/inset so :placeholder-shown works
  const shouldInjectSpacePlaceholder =
    usingInternalLabel &&
    !inputValue &&
    (!placeholder || placeholder.length === 0);
  const effectivePlaceholder = shouldInjectSpacePlaceholder ? ' ' : placeholder;

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
            placeholder={effectivePlaceholder}
            disabled={disabled}
            readOnly={readOnly}
            aria-invalid={!!error || undefined}
            aria-required={required || undefined}
            aria-label={
              !externalLabel && !inputInternalLabel
                ? ariaLabel ?? 'Date input'
                : undefined
            }
            aria-describedby={error ? descrId : undefined}
            endIcon={<CalendarIcon className="h-5 w-5" />}
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

DatePicker.displayName = 'DatePicker';
export { DatePicker };
export default DatePicker;
