'use client';

import * as React from 'react';
import { Clock } from 'lucide-react';

import { cn } from '../../../lib/utils';
import Input from '../Input/Input';
import Select from '../Select/Select';
import Button from '../Button';
import Popover from '../Popover/Popover';

import type { DateAdapter } from '../../../lib/date/types';
import { vanillaAdapter } from '../../../lib/date';

/* ---------------------------------- types ---------------------------------- */

export interface TimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
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
  timeFormat?: '12' | '24';
  displayFormat?: string;
  minuteStep?: number; // default 1 (controls menu density only)
  showSeconds?: boolean; // default false
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  enableQuickActions?: boolean; // Now / Clear / Done
  readOnly?: boolean;
  ariaLabel?: string;
  dateAdapter?: DateAdapter;
  deferInitialRender?: boolean;
}

/* --------------------------------- helpers --------------------------------- */

const STABLE_EPOCH = new Date(Date.UTC(2000, 0, 1, 0, 0, 0));

const mapToControlSize = (s: NonNullable<TimePickerProps['inputSize']>) =>
  s === 'xs' ? 'sm' : s === 'xl' ? 'lg' : s;
const mapToInputSize = mapToControlSize;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatTimeOnly = (
  d: Date,
  tf: '12' | '24',
  showSeconds: boolean
): string => {
  try {
    const fmt = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: tf === '12',
    });
    return fmt.format(d);
  } catch {
    const h = d.getHours();
    const m = pad2(d.getMinutes());
    const s = pad2(d.getSeconds());
    if (tf === '12') {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return showSeconds
        ? `${h12}:${m}:${s} ${period}`
        : `${h12}:${m} ${period}`;
    }
    return showSeconds ? `${pad2(h)}:${m}:${s}` : `${pad2(h)}:${m}`;
  }
};

const parseTimeLoose = (
  text: string,
  base: Date,
  tf: '12' | '24',
  showSeconds: boolean
): Date | null => {
  const v = text.trim();
  if (tf === '12') {
    const re = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])$/;
    const m = v.match(re);
    if (!m) return null;
    let [_, hStr, minStr, secStr, periodRaw] = m;
    let h = clamp(parseInt(hStr, 10), 1, 12);
    const mins = clamp(parseInt(minStr, 10), 0, 59);
    const secs = clamp(secStr ? parseInt(secStr, 10) : 0, 0, 59);
    const period = periodRaw.toUpperCase() as 'AM' | 'PM';
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    const d = new Date(base);
    d.setHours(h, mins, showSeconds ? secs : 0, 0);
    return d;
  }
  const re = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;
  const m = v.match(re);
  if (!m) return null;
  const [__, hStr, minStr, secStr] = m;
  const h = clamp(parseInt(hStr, 10), 0, 23);
  const mins = clamp(parseInt(minStr, 10), 0, 59);
  const secs = clamp(secStr ? parseInt(secStr, 10) : 0, 0, 59);
  const d = new Date(base);
  d.setHours(h, mins, showSeconds ? secs : 0, 0);
  return d;
};

type TimeState = {
  hours: string;
  minutes: string;
  seconds?: string;
  period?: 'AM' | 'PM';
};

const fromDateToState = (
  d: Date | undefined,
  tf: '12' | '24',
  showSeconds: boolean
): TimeState => {
  const baseH = d ? d.getHours() : 0;
  const baseM = d ? d.getMinutes() : 0;
  const baseS = d ? d.getSeconds() : 0;

  if (tf === '12') {
    const period = baseH >= 12 ? 'PM' : 'AM';
    const h12 = baseH % 12 || 12;
    return {
      hours: String(h12),
      minutes: String(baseM),
      seconds: showSeconds ? String(baseS) : undefined,
      period,
    };
  }
  return {
    hours: String(baseH),
    minutes: String(baseM),
    seconds: showSeconds ? String(baseS) : undefined,
  };
};

const toDateFromState = (
  state: TimeState,
  current: Date,
  tf: '12' | '24',
  showSeconds: boolean
): Date => {
  const is12 = tf === '12';
  const rawH = clamp(parseInt(state.hours || '0', 10), 0, is12 ? 12 : 23);
  const h24 = is12
    ? (rawH % 12) + (state.period === 'PM' ? 12 : 0)
    : clamp(rawH, 0, 23);
  const m = clamp(parseInt(state.minutes || '0', 10), 0, 59);
  const s = showSeconds ? clamp(parseInt(state.seconds || '0', 10), 0, 59) : 0;
  const d = new Date(current);
  d.setHours(h24, m, s, 0);
  return d;
};

/* -------------------------------- component -------------------------------- */

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select time',
  disabled = false,
  label,
  error,
  required = false,
  className,
  inputSize = 'md',
  variant = 'default',
  timeFormat = '12',
  displayFormat,
  minuteStep = 1,
  showSeconds = false,
  open: controlledOpen,
  onOpenChange,
  enableQuickActions = true,
  readOnly = false,
  ariaLabel,
  dateAdapter = vanillaAdapter,
  deferInitialRender = true,
}) => {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const inputId = React.useId();
  const descrId = React.useId();

  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (o: boolean) =>
    onOpenChange ? onOpenChange(o) : setInternalOpen(o);

  const [inputValue, setInputValue] = React.useState(() => {
    if (!deferInitialRender) {
      return value ? formatTimeOnly(value, timeFormat, showSeconds) : '';
    }
    return '';
  });

  React.useEffect(() => {
    if (!mounted && deferInitialRender) return;
    if (value) setInputValue(formatTimeOnly(value, timeFormat, showSeconds));
    else setInputValue('');
  }, [mounted, value, timeFormat, showSeconds, deferInitialRender]);

  const [timeValue, setTimeValue] = React.useState<TimeState>(() =>
    fromDateToState(
      value && dateAdapter.isValid(value) ? value : undefined,
      timeFormat,
      showSeconds
    )
  );

  React.useEffect(() => {
    if (value && dateAdapter.isValid(value)) {
      setTimeValue(fromDateToState(value, timeFormat, showSeconds));
    }
  }, [value, timeFormat, showSeconds, dateAdapter]);

  const commit = (next: TimeState) => {
    const base =
      value && dateAdapter.isValid(value)
        ? value
        : deferInitialRender
        ? STABLE_EPOCH
        : dateAdapter.now();
    const updated = toDateFromState(next, base, timeFormat, showSeconds);
    onChange?.(updated);
    setInputValue(formatTimeOnly(updated, timeFormat, showSeconds));
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);

    const base =
      value ?? (deferInitialRender ? STABLE_EPOCH : dateAdapter.now());
    const parsedLoose = parseTimeLoose(v, base, timeFormat, showSeconds);

    if (parsedLoose && dateAdapter.isValid(parsedLoose)) {
      setTimeValue(fromDateToState(parsedLoose, timeFormat, showSeconds));
      onChange?.(parsedLoose);
      return;
    }

    if (displayFormat) {
      try {
        const parsed = dateAdapter.parse(
          v,
          displayFormat,
          deferInitialRender ? STABLE_EPOCH : dateAdapter.now()
        );
        if (dateAdapter.isValid(parsed)) {
          setTimeValue(fromDateToState(parsed, timeFormat, showSeconds));
          onChange?.(parsed);
        }
      } catch {
        /* ignore */
      }
    }
  };

  /* --------------------------------- options --------------------------------- */
  const controlSize = mapToControlSize(inputSize);

  const hoursOptions =
    timeFormat === '12'
      ? Array.from({ length: 12 }, (_, i) => String(i + 1))
      : Array.from({ length: 24 }, (_, i) => String(i));

  const minutesValues = React.useMemo(() => {
    const step = Math.max(1, minuteStep);
    let vals = Array.from({ length: Math.ceil(60 / step) }, (_, i) =>
      String(i * step)
    );
    if (!vals.includes(timeValue.minutes)) {
      vals = [...vals, timeValue.minutes].sort((a, b) => Number(a) - Number(b));
    }
    return vals;
  }, [minuteStep, timeValue.minutes]);

  const secondsOptions = showSeconds
    ? Array.from({ length: 60 }, (_, i) => String(i))
    : [];

  const mappedVariant =
    variant === 'floating'
      ? 'outlined'
      : variant === 'inset'
      ? 'filled'
      : variant;

  /* ---------- icon sizing (Lucide numeric size; use mapped visual size) ---------- */
  const iconPxFor = (s: 'sm' | 'md' | 'lg') =>
    s === 'sm' ? 16 : s === 'md' ? 20 : 24;

  // Use mapped sizes so the icon height matches the actual control/input height.
  const controlIconPx = iconPxFor(controlSize); // icon in the popover header
  const inputVisualSize = mapToInputSize(inputSize); // 'xs'|'xl' → 'sm'|'lg'
  const inputIconPx = iconPxFor(inputVisualSize); // icon in the input adornment

  /* --------------------------------- content --------------------------------- */
  const TimeControls = (
    <div
      className="p-3 space-y-3"
      aria-label="Time selector"
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        {/* block avoids baseline misalignment; size tied to mapped control size */}
        <Clock
          size={controlIconPx}
          aria-hidden="true"
          className="block shrink-0"
        />
        Time
      </div>

      <div className="flex items-center gap-2">
        <Select
          options={hoursOptions.map((h) => ({
            value: h,
            label: pad2(Number(h)),
          }))}
          value={timeValue.hours}
          onChange={(v) => {
            const next = { ...timeValue, hours: v };
            setTimeValue(next);
            commit(next);
          }}
          size={controlSize}
          variant={mappedVariant}
          fixedTriggerWidth={64}
          aria-label="Hours"
        />

        <span aria-hidden>:</span>

        <Select
          options={minutesValues.map((m) => ({
            value: m,
            label: pad2(Number(m)),
          }))}
          value={timeValue.minutes}
          onChange={(v) => {
            const next = { ...timeValue, minutes: v };
            setTimeValue(next);
            commit(next);
          }}
          size={controlSize}
          variant={mappedVariant}
          fixedTriggerWidth={64}
          aria-label="Minutes"
        />

        {showSeconds && (
          <>
            <span aria-hidden>:</span>
            <Select
              options={secondsOptions.map((s) => ({
                value: s,
                label: pad2(Number(s)),
              }))}
              value={timeValue.seconds ?? '0'}
              onChange={(v) => {
                const next = { ...timeValue, seconds: v };
                setTimeValue(next);
                commit(next);
              }}
              size={controlSize}
              variant={mappedVariant}
              fixedTriggerWidth={64}
              aria-label="Seconds"
            />
          </>
        )}

        {timeFormat === '12' && (
          <Select
            options={[
              { value: 'AM', label: 'AM' },
              { value: 'PM', label: 'PM' },
            ]}
            value={timeValue.period}
            onChange={(v) => {
              const next = { ...timeValue, period: v as 'AM' | 'PM' };
              setTimeValue(next);
              commit(next);
            }}
            size={controlSize}
            variant={mappedVariant}
            fixedTriggerWidth={72}
            aria-label="AM or PM"
          />
        )}
      </div>
    </div>
  );

  const QuickActions = enableQuickActions ? (
    <div className="border-t p-2 flex items-center justify-between gap-2">
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          const now = dateAdapter.now();
          const h24 = now.getHours();
          const mm = now.getMinutes();
          const ss = showSeconds ? now.getSeconds() : 0;
          const adjusted = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            h24,
            mm,
            ss,
            0
          );

          const next: TimeState =
            timeFormat === '12'
              ? {
                  hours: String(h24 % 12 || 12),
                  minutes: String(mm),
                  seconds: showSeconds ? String(ss) : undefined,
                  period: h24 >= 12 ? 'PM' : 'AM',
                }
              : {
                  hours: String(h24),
                  minutes: String(mm),
                  seconds: showSeconds ? String(ss) : undefined,
                };

          setTimeValue(next);
          setInputValue(formatTimeOnly(adjusted, timeFormat, showSeconds));
          onChange?.(adjusted);
        }}
      >
        Now
      </Button>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            onChange?.(undefined);
            setInputValue('');
            setTimeValue(fromDateToState(undefined, timeFormat, showSeconds));
          }}
        >
          Clear
        </Button>
        <Button
          size="sm"
          onClick={() => setOpen(false)}
        >
          Done
        </Button>
      </div>
    </div>
  ) : null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      className="w-[280px] bg-white border border-gray-200 rounded-md shadow-md"
    >
      {TimeControls}
      {QuickActions}
    </div>
  );

  /* -------------------------- placeholder/label wiring ------------------------ */
  const usingInternalLabel = variant === 'floating' || variant === 'inset';
  const externalLabel = label && !usingInternalLabel ? label : undefined;
  const inputInternalLabel = usingInternalLabel ? label : undefined;

  const shouldInjectSpacePlaceholder =
    usingInternalLabel &&
    !inputValue &&
    (!placeholder || placeholder.length === 0);
  const effectivePlaceholder = shouldInjectSpacePlaceholder ? ' ' : placeholder;

  /* ---------------------------------- render --------------------------------- */
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
      >
        <div className="relative">
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
                ? ariaLabel ?? 'Time input'
                : undefined
            }
            aria-describedby={error ? descrId : undefined}
            endIcon={
              // Use mapped visual size for icon + block to center vertically across sizes
              <Clock
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

TimePicker.displayName = 'TimePicker';

export { TimePicker };
export default TimePicker;
