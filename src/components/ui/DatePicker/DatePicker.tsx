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

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface DatePickerProps {
  /** Unified value shape */
  value?: DateRange;
  onChange?: (range: DateRange) => void;

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

  /** Single-field range selection (e.g., “Jan 02, 2025 – Jan 12, 2025”). */
  enableRange?: boolean;

  /** Dual-input range selection (Start / End). Takes precedence visually if both are true. */
  enableMultiInputRange?: boolean;
}

/** Midday UTC avoids TZ rollovers to the prior day/year during SSR */
const STABLE_EPOCH = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));

// Force month/year without time regardless of adapter behavior
const formatMonthYear = (d: Date) => {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    const month = d.toLocaleString('en-US', { month: 'long' });
    return `${month} ${d.getFullYear()}`;
  }
};
const formatYearOnly = (d: Date) => String(d.getFullYear());

/** Map extended input sizes → nearest supported input size ('sm'|'md'|'lg') */
const mapToInputSize = (s: NonNullable<DatePickerProps['inputSize']>) =>
  s === 'xs' ? 'sm' : s === 'xl' ? 'lg' : s;

/** Lucide numeric pixels for 'sm' | 'md' | 'lg' */
const iconPxFor = (s: 'sm' | 'md' | 'lg') =>
  s === 'sm' ? 16 : s === 'md' ? 20 : 24;

const formatDateOnlySafe = (adapter: DateAdapter, fmt: string, d?: Date) => {
  if (!d || !adapter.isValid(d)) return '';
  const out = adapter.format(d, fmt);
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

  enableRange = false,
  enableMultiInputRange = false,
}) => {
  // Modes
  const rangeMode = enableRange || enableMultiInputRange;
  const multiInputMode = enableMultiInputRange;

  // --- SSR hydration guard (avoid formatting "now" on the server) ---
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // a11y ids
  const inputId = React.useId();
  const descrId = React.useId();
  const gridId = React.useId();

  // Treat an empty object like “no selection”
  const hasAnySelection =
    !!(value?.start && dateAdapter.isValid(value.start)) ||
    !!(value?.end && dateAdapter.isValid(value.end));

  // popover state (controlled/uncontrolled)
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (o: boolean) =>
    onOpenChange ? onOpenChange(o) : setInternalOpen(o);

  // View date (month shown)
  const initialViewBase =
    value?.start && dateAdapter.isValid(value.start)
      ? value.start
      : value?.end && dateAdapter.isValid(value.end)
      ? value.end
      : deferInitialRender
      ? STABLE_EPOCH
      : dateAdapter.now();

  const [viewDate, setViewDate] = React.useState<Date>(() => initialViewBase);

  // align to now after mount if there's no selection
  React.useEffect(() => {
    if (!mounted) return;
    if (!hasAnySelection && deferInitialRender) {
      const now = dateAdapter.now();
      setViewDate(now);
      setActiveDay(now);
    }
  }, [mounted, hasAnySelection, deferInitialRender, dateAdapter]);

  // ---- DATE-ONLY formatter (never show time in input) ----
  const formatDateOnly = (d?: Date) =>
    formatDateOnlySafe(dateAdapter, dateFormat, d);

  // formatted input values (SSR-safe)
  const [singleFieldText, setSingleFieldText] = React.useState<string>('');
  const [startInputText, setStartInputText] = React.useState<string>('');
  const [endInputText, setEndInputText] = React.useState<string>('');

  // view mode: day/month/year
  const [view, setView] = React.useState<'day' | 'month' | 'year'>('day');

  // keyboard focus day
  const [activeDay, setActiveDay] = React.useState<Date>(() => {
    const base = value?.start ?? value?.end ?? initialViewBase;
    return base;
  });

  // Range interactions
  const [selectingStart, setSelectingStart] = React.useState(true);
  const [hoverDate, setHoverDate] = React.useState<Date | undefined>(undefined);

  // Sync displayed text from value
  React.useEffect(() => {
    if (!mounted && deferInitialRender) return;

    const start = value?.start;
    const end = value?.end;

    if (!rangeMode) {
      // single-date UI → show start only
      setSingleFieldText(start ? formatDateOnly(start) : '');
    } else if (!multiInputMode) {
      // single-field range
      if (start && end)
        setSingleFieldText(`${formatDateOnly(start)} – ${formatDateOnly(end)}`);
      else if (start) setSingleFieldText(`${formatDateOnly(start)} – …`);
      else if (end) setSingleFieldText(`… – ${formatDateOnly(end)}`);
      else setSingleFieldText('');
    } else {
      // dual inputs
      setStartInputText(start ? formatDateOnly(start) : '');
      setEndInputText(end ? formatDateOnly(end) : '');
    }

    const base = start ?? end;
    if (base && dateAdapter.isValid(base)) {
      setViewDate(base);
      setActiveDay(base);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, value, dateFormat, rangeMode, multiInputMode]);

  // ---- parsing free-typed input (single-date OR multi-input range) ----
  const parseFreeText = (text: string) => {
    try {
      const parsed = dateAdapter.parse(text, dateFormat, dateAdapter.now());
      return dateAdapter.isValid(parsed)
        ? dateAdapter.startOfDay(parsed)
        : undefined;
    } catch {
      return undefined;
    }
  };

  const onSingleFieldInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSingleFieldText(text);
    const parsed = parseFreeText(text);
    onChange?.({ start: parsed, end: rangeMode ? value?.end : undefined });
  };

  const onStartInputChange = (text: string) => {
    setStartInputText(text);
    const parsed = parseFreeText(text);
    onChange?.({ start: parsed, end: value?.end });
  };

  const onEndInputChange = (text: string) => {
    setEndInputText(text);
    const parsed = parseFreeText(text);
    onChange?.({ start: value?.start, end: parsed });
  };

  // ---- predicates ----
  const isDateDisabled = (date: Date) => {
    if (minDate && dateAdapter.isBefore(date, dateAdapter.startOfDay(minDate)))
      return true;
    if (maxDate && dateAdapter.isAfter(date, dateAdapter.endOfDay(maxDate)))
      return true;
    return (disabledDates || []).some((d) => dateAdapter.isSameDay(date, d));
  };
  const isToday = (date: Date) =>
    dateAdapter.isSameDay(date, dateAdapter.now());

  const inRange = (d: Date, r?: DateRange) => {
    if (!r?.start || !r?.end) return false;
    const s = dateAdapter.startOfDay(r.start);
    const e = dateAdapter.endOfDay(r.end);
    return !dateAdapter.isBefore(d, s) && !dateAdapter.isAfter(d, e);
  };

  const inHoverRange = (d: Date, r?: DateRange, hover?: Date) => {
    if (!r?.start || !hover || selectingStart) return false;
    const start = dateAdapter.isBefore(hover, r.start) ? hover : r.start;
    const end = dateAdapter.isBefore(hover, r.start) ? r.start : hover;
    const s = dateAdapter.startOfDay(start);
    const e = dateAdapter.endOfDay(end);
    return !dateAdapter.isBefore(d, s) && !dateAdapter.isAfter(d, e);
  };

  // ---- select a day ----
  const handleDateSelect = (date: Date) => {
    const d = dateAdapter.startOfDay(date);

    if (!rangeMode) {
      onChange?.({ start: d, end: undefined });
      setOpen(false);
      return;
    }

    const current = value ?? {};
    if (selectingStart || !current.start) {
      onChange?.({ start: d, end: current.end });
      setSelectingStart(false);
      return;
    }

    // selecting end
    let start = current.start;
    let end = d;
    if (dateAdapter.isBefore(end, start)) [start, end] = [end, start];
    onChange?.({ start, end });
    setSelectingStart(true);
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

  // ---------- sizing for icons (use mapped 'sm'|'md'|'lg') ----------
  const inputVisualSize = mapToInputSize(inputSize);
  const inputIconPx = iconPxFor(inputVisualSize);
  const controlIconPx = inputIconPx;

  // ---- calendar body ----
  const renderCalendar = () => {
    const year = dateAdapter.getYear(viewDate);
    const month = dateAdapter.getMonth(viewDate);
    const r = value ?? {};

    if (view === 'year') {
      const startYear = Math.floor(year / 10) * 10;
      const years = Array.from({ length: 12 }, (_, i) => startYear + i - 1);
      return (
        <div
          className="grid grid-cols-3 gap-2 p-2"
          role="listbox"
          aria-label={rangeMode ? 'Select year for range' : 'Select year'}
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
          aria-label={rangeMode ? 'Select month for range' : 'Select month'}
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

      const isStart = !!r.start && dateAdapter.isSameDay(date, r.start);
      const isEnd = !!r.end && dateAdapter.isSameDay(date, r.end);
      const isSingleSelected =
        !rangeMode && !!r.start && dateAdapter.isSameDay(date, r.start);

      const disabledDay = isDateDisabled(date);
      const lockHover = disabledDay || isSingleSelected || isStart || isEnd;

      const inActiveRange = rangeMode && inRange(date, r);
      const inPreviewRange = rangeMode && inHoverRange(date, r, hoverDate);

      const label = mounted ? dateAdapter.format(date, 'PPPP') : '';

      cells.push(
        <Button
          key={date.toISOString()}
          type="button"
          role="gridcell"
          aria-selected={isSingleSelected || isStart || isEnd || undefined}
          aria-current={isToday(date) ? 'date' : undefined}
          aria-disabled={disabledDay || undefined}
          tabIndex={
            disabledDay ? -1 : dateAdapter.isSameDay(date, activeDay) ? 0 : -1
          }
          onFocus={() => !disabledDay && setActiveDay(date)}
          onClick={() => !disabledDay && handleDateSelect(date)}
          onMouseEnter={() => rangeMode && setHoverDate(date)}
          onMouseLeave={() => rangeMode && setHoverDate(undefined)}
          size="icon"
          variant={lockHover ? 'unstyled' : 'ghost'}
          className={cn(
            'h-8 w-8 p-0 rounded-md text-sm flex items-center justify-center',
            !inThisMonth && 'text-gray-400',
            disabledDay && 'cursor-default opacity-50',
            (isSingleSelected || isStart || isEnd) && 'bg-blue-600 text-white',
            !lockHover && (inActiveRange || inPreviewRange) && 'bg-blue-500/15'
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
            const today = dateAdapter.startOfDay(dateAdapter.now());
            setViewDate(today);
            if (!rangeMode) onChange?.({ start: today, end: undefined });
            else onChange?.({ start: today, end: today });
          }}
        >
          Today
        </Button>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange?.({ start: undefined, end: undefined });
              setSingleFieldText('');
              setStartInputText('');
              setEndInputText('');
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
          size={controlIconPx}
          className="block shrink-0"
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
      <div className="p-2 border-t text-xs text-gray-600">
        {rangeMode
          ? selectingStart
            ? 'Select start date'
            : 'Select end date'
          : 'Select a date'}
      </div>
      {renderQuick()}
    </div>
  );

  // internal vs external label (for floating/inset)
  const usingInternalLabel = variant === 'floating' || variant === 'inset';
  const externalLabel = label && !usingInternalLabel ? label : undefined;
  const inputInternalLabel = usingInternalLabel ? label : undefined;

  // inject a single-space placeholder for floating/inset so :placeholder-shown works
  const shouldInjectSpacePlaceholder =
    usingInternalLabel &&
    !singleFieldText &&
    (!placeholder || placeholder.length === 0);
  const effectivePlaceholder = shouldInjectSpacePlaceholder ? ' ' : placeholder;

  // ----- trigger UI (single input vs dual inputs) -----
  const triggerSingleInput = (
    <div
      role="combobox"
      aria-expanded={open}
      aria-controls={open ? gridId : undefined}
      aria-haspopup="dialog"
      className="relative"
    >
      <Input
        id={inputId}
        value={singleFieldText}
        onChange={onSingleFieldInputChange}
        placeholder={rangeMode ? 'Select date range' : effectivePlaceholder}
        disabled={disabled}
        readOnly={readOnly || (rangeMode && !multiInputMode)}
        aria-invalid={!!error || undefined}
        aria-required={required || undefined}
        aria-label={
          !externalLabel && !inputInternalLabel
            ? ariaLabel ?? (rangeMode ? 'Date range input' : 'Date input')
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
        inputSize={mapToInputSize(inputSize)}
        variant={variant}
        label={inputInternalLabel}
        error={error}
        required={required}
      />
    </div>
  );

  const triggerDualInputs = (
    <div className="flex gap-2">
      <div
        className="relative flex-1"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Input
          id={`${inputId}-start`}
          value={startInputText}
          onChange={(e) => onStartInputChange(e.target.value)}
          placeholder="Start date"
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? descrId : undefined}
          endIcon={
            <CalendarIcon
              size={inputIconPx}
              className="block shrink-0"
              aria-hidden="true"
            />
          }
          suppressHydrationWarning
          inputSize={mapToInputSize(inputSize)}
          variant={variant}
          label={
            inputInternalLabel ? `${inputInternalLabel} (start)` : undefined
          }
          error={error}
          required={required}
        />
      </div>
      <div
        className="relative flex-1"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Input
          id={`${inputId}-end`}
          value={endInputText}
          onChange={(e) => onEndInputChange(e.target.value)}
          placeholder="End date"
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? descrId : undefined}
          endIcon={
            <CalendarIcon
              size={inputIconPx}
              className="block shrink-0"
              aria-hidden="true"
            />
          }
          suppressHydrationWarning
          inputSize={mapToInputSize(inputSize)}
          variant={variant}
          label={inputInternalLabel ? `${inputInternalLabel} (end)` : undefined}
          error={error}
          required={required}
        />
      </div>
    </div>
  );

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
        {multiInputMode ? triggerDualInputs : triggerSingleInput}
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
