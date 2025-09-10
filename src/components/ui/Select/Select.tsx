'use client';

import type React from 'react';
import {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useId,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined' | 'ghost' | 'underline';
  noMinWidth?: boolean;
  fullWidth?: boolean;
  required?: boolean;
  showFocusRing?: boolean;
  id?: string;
  containerClassName?: string;
  className?: string;
  fixedTriggerWidth?: number;
  maxTriggerWidth?: number;
  truncateTriggerLabel?: boolean;
}

const ROW_H = { sm: 32, md: 36, lg: 44 } as const;
const CARET_W = 16;
const CARET_GAP = 8;
const CARET_SAFETY = 4;
const caretPadRight = CARET_W + CARET_GAP + CARET_SAFETY;

const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option...',
      label,
      error,
      helperText,
      disabled = false,
      size = 'md',
      variant = 'default',
      noMinWidth = false,
      fullWidth = false,
      required = false,
      showFocusRing = false,
      id,
      containerClassName,
      className = '',
      fixedTriggerWidth,
      maxTriggerWidth,
      truncateTriggerLabel = false,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({
      top: 0,
      left: 0,
      width: 0,
    });

    // A11y & typeahead
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const typeaheadRef = useRef({ buffer: '', lastTime: 0 });

    const selectRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLDivElement>(null);

    const generatedId = useId();
    const selectId = id || `select-${generatedId}`;
    const labelId = label ? `${selectId}-label` : undefined;
    const listboxId = `${selectId}-listbox`;

    const selectedIndex = options.findIndex((o) => o.value === value);
    const selectedOption =
      selectedIndex >= 0 ? options[selectedIndex] : undefined;

    // A11y ids
    const helperId = helperText ? `${selectId}-help` : undefined;
    const errorText = typeof error === 'string' ? error : undefined;
    const errorId = errorText ? `${selectId}-error` : undefined;
    const describedBy =
      [helperId, errorId].filter(Boolean).join(' ') || undefined;

    /* --------------------------- positioning / sizing -------------------------- */

    const measureLongestOptionWidth = (): number => {
      if (typeof document === 'undefined') return 0;
      const measurer = document.createElement('div');
      measurer.style.position = 'fixed';
      measurer.style.visibility = 'hidden';
      measurer.style.pointerEvents = 'none';
      measurer.style.top = '-9999px';
      measurer.style.left = '-9999px';
      measurer.style.whiteSpace = 'nowrap';

      const itemClass =
        size === 'sm'
          ? 'px-3 py-2 text-sm'
          : size === 'lg'
          ? 'px-4 py-3 text-lg'
          : 'px-3 py-2 text-base';

      const base = document.createElement('div');
      base.className = `bg-white ${itemClass}`;
      base.style.whiteSpace = 'nowrap';

      let max = 0;
      options.forEach((opt) => {
        const row = base.cloneNode(false) as HTMLDivElement;
        row.textContent = opt.label;
        measurer.appendChild(row);
      });

      document.body.appendChild(measurer);
      const checkReserve = 24;
      measurer.childNodes.forEach((n) => {
        const w = (n as HTMLElement).offsetWidth + checkReserve;
        if (w > max) max = w;
      });
      document.body.removeChild(measurer);

      return Math.ceil(max + 4);
    };

    const computeAndSetPopupGeometry = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();

      const estRowH = ROW_H[size] ?? 36;
      const dropdownHeight = Math.min(
        240,
        Math.max(estRowH, options.length * estRowH)
      );
      const viewportH = window.innerHeight;

      const spaceBelow = viewportH - rect.bottom;
      const spaceAbove = rect.top;
      const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      const longest = measureLongestOptionWidth();
      const desiredWidth = Math.max(rect.width, longest);

      const margin = 8;
      const viewportW = window.innerWidth;
      let left = rect.left;
      let width = desiredWidth;

      if (left + width > viewportW - margin) {
        left = Math.max(margin, viewportW - margin - width);
        if (width > viewportW - margin * 2) {
          width = viewportW - margin * 2;
        }
      }

      setDropdownPosition({
        top: openUpward ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left,
        width,
      });
    };

    useLayoutEffect(() => {
      if (isOpen) computeAndSetPopupGeometry();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, options, size]);

    /* --------------------------- open/close behaviors -------------------------- */

    const eventFromInside = (e: Event) => {
      const path = (e as any).composedPath?.() as EventTarget[] | undefined;
      const inPopupOrTrigger = (node: EventTarget) =>
        (listboxRef.current &&
          node instanceof Node &&
          listboxRef.current.contains(node)) ||
        (selectRef.current &&
          node instanceof Node &&
          selectRef.current.contains(node));

      if (path && path.length) return path.some(inPopupOrTrigger);

      const target = e.target as Node | null;
      if (!target) return false;
      return (
        (listboxRef.current?.contains(target) ?? false) ||
        (selectRef.current?.contains(target) ?? false)
      );
    };

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (eventFromInside(event)) return;
        setIsOpen(false);
        setActiveIndex(null);
      };

      const handleScroll = (event: Event) => {
        if (eventFromInside(event)) return;
        setIsOpen(false);
        setActiveIndex(null);
      };

      const handleResize = () => {
        setIsOpen(false);
        setActiveIndex(null);
      };

      if (isOpen) {
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('scroll', handleScroll, {
          capture: true,
          passive: true,
        });
        window.addEventListener('resize', handleResize, { passive: true });
      }
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }, [isOpen]);

    useEffect(() => {
      if (isOpen) {
        const initial =
          selectedIndex >= 0
            ? selectedIndex
            : options.findIndex((o) => !o.disabled);
        setActiveIndex(initial >= 0 ? initial : null);
        requestAnimationFrame(computeAndSetPopupGeometry);
      } else {
        typeaheadRef.current.buffer = '';
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, selectedIndex, options]);

    useEffect(() => {
      if (!isOpen || activeIndex == null || !listboxRef.current) return;
      const activeEl = document.getElementById(
        `${selectId}-opt-${activeIndex}`
      );
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }, [activeIndex, isOpen, selectId]);

    /* --------------------------------- styles -------------------------------- */

    const wrapperClasses = cn(
      'min-w-0',
      fullWidth ? 'block w-full flex-1' : 'inline-block',
      containerClassName
    );

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-sm',
      md: 'px-3 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const variantClasses = {
      default: 'border border-gray-300 bg-white hover:bg-gray-50',
      filled: 'border-transparent bg-gray-100 hover:bg-white',
      outlined: 'border-2 border-gray-300 bg-transparent hover:bg-white',
      ghost: 'border border-transparent bg-transparent hover:bg-gray-50',
      underline:
        'border-0 border-b-2 border-gray-300 bg-transparent rounded-none hover:border-b-gray-50',
    };

    const errorClasses = error
      ? variant === 'underline'
        ? '!border-b-red-500 focus:!border-b-red-500 hover:!border-b-red-500'
        : '!border-red-500 focus:!border-red-500 hover:!border-red-500 focus:!ring-red-500'
      : '';

    const disabledClasses = disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'cursor-pointer';

    const selectClasses = cn(
      'relative flex items-center rounded-md transition-colors focus:outline-none',
      sizeClasses[size],
      variantClasses[variant],
      errorClasses,
      disabledClasses,
      fullWidth ? 'w-full' : 'inline-flex',
      !noMinWidth && !fullWidth && !fixedTriggerWidth && 'min-w-[120px]',
      showFocusRing && 'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
      className
    );

    /* ---------------------------- selection / keys ---------------------------- */

    const optionId = (index: number) => `${selectId}-opt-${index}`;

    const handleOptionSelect = (optionValue: string) => {
      if (!disabled) {
        onChange?.(optionValue);
        setIsOpen(false);
        requestAnimationFrame(() => triggerRef.current?.focus());
      }
    };

    const nextEnabled = (start: number, dir: 1 | -1) => {
      if (options.length === 0) return null;
      let i = start;
      for (let step = 0; step < options.length; step++) {
        i = Math.min(Math.max(i + dir, 0), options.length - 1);
        if (!options[i].disabled) return i;
        if ((dir === 1 && i === options.length - 1) || (dir === -1 && i === 0))
          break;
      }
      return start;
    };

    const firstEnabled = () => {
      const idx = options.findIndex((o) => !o.disabled);
      return idx === -1 ? null : idx;
    };

    const lastEnabled = () => {
      for (let i = options.length - 1; i >= 0; i--) {
        if (!options[i].disabled) return i;
      }
      return null;
    };

    const runTypeahead = (char: string) => {
      const now = Date.now();
      const isStale = now - typeaheadRef.current.lastTime > 700;
      const buf =
        (isStale ? '' : typeaheadRef.current.buffer) + char.toLowerCase();
      typeaheadRef.current.buffer = buf;
      typeaheadRef.current.lastTime = now;

      const start = (activeIndex ?? selectedIndex ?? -1) + 1;
      const normalized = (i: number) => (i + options.length) % options.length;

      for (let step = 0; step < options.length; step++) {
        const idx = normalized(start + step);
        const opt = options[idx];
        if (!opt.disabled && opt.label.toLowerCase().startsWith(buf)) {
          setActiveIndex(idx);
          return;
        }
      }
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (disabled) return;

      const key = event.key;

      if (
        key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (!isOpen) setIsOpen(true);
        runTypeahead(key);
        event.preventDefault();
        return;
      }

      switch (key) {
        case 'Enter':
        case ' ': {
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else if (activeIndex != null) {
            const opt = options[activeIndex];
            if (opt && !opt.disabled) handleOptionSelect(opt.value);
          }
          break;
        }
        case 'Escape': {
          if (isOpen) {
            event.preventDefault();
            setIsOpen(false);
            setActiveIndex(null);
          }
          break;
        }
        case 'ArrowDown': {
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabled());
          } else {
            const current = activeIndex ?? selectedIndex ?? -1;
            const next = nextEnabled(Math.max(current, -1), 1);
            if (next != null) setActiveIndex(next);
          }
          break;
        }
        case 'ArrowUp': {
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setActiveIndex(selectedIndex >= 0 ? selectedIndex : lastEnabled());
          } else {
            const current = activeIndex ?? selectedIndex ?? options.length;
            const prev = nextEnabled(Math.min(current, options.length), -1);
            if (prev != null) setActiveIndex(prev);
          }
          break;
        }
        case 'Home': {
          if (isOpen) {
            event.preventDefault();
            const first = firstEnabled();
            if (first != null) setActiveIndex(first);
          }
          break;
        }
        case 'End': {
          if (isOpen) {
            event.preventDefault();
            const last = lastEnabled();
            if (last != null) setActiveIndex(last);
          }
          break;
        }
        case 'Tab': {
          setIsOpen(false);
          setActiveIndex(null);
          break;
        }
      }
    };

    /* ------------------------------ portal popup ------------------------------ */

    const DropdownPortal = () => {
      if (!isOpen || typeof window === 'undefined') return null;

      return createPortal(
        <>
          {/* overlay to close dropdown; make sure events don't bubble to document */}
          <div
            className="fixed inset-0 z-40"
            onPointerDown={(e) => {
              e.stopPropagation();
              setIsOpen(false);
              setActiveIndex(null);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            ref={listboxRef}
            id={listboxId}
            data-twine-keepopen="true"
            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto overflow-x-hidden whitespace-nowrap"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
            }}
            role="listbox"
            aria-labelledby={labelId}
            onWheelCapture={(e) => e.stopPropagation()}
            onTouchMoveCapture={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No options available
              </div>
            ) : (
              options.map((option, i) => {
                const isSelected = value === option.value;
                const isActive = activeIndex === i;

                return (
                  <button
                    key={option.value}
                    id={optionId(i)}
                    type="button"
                    className={cn(
                      'w-full flex items-center px-3 py-2 text-sm cursor-pointer transition-colors text-left whitespace-nowrap',
                      option.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-gray-100',
                      isSelected && 'bg-blue-50 text-blue-600',
                      isActive && 'bg-gray-100'
                    )}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() =>
                      !option.disabled && handleOptionSelect(option.value)
                    }
                    onMouseMove={() => !option.disabled && setActiveIndex(i)}
                    disabled={option.disabled}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                  >
                    <span className="flex-1">{option.label}</span>
                    <span
                      className="inline-block w-4 ml-2 text-right"
                      aria-hidden="true"
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>,
        document.body
      );
    };

    /* -------------------------------- render --------------------------------- */

    const triggerStyle: React.CSSProperties = {
      ...(fixedTriggerWidth
        ? { width: fixedTriggerWidth, minWidth: fixedTriggerWidth }
        : undefined),
      ...(maxTriggerWidth ? { maxWidth: maxTriggerWidth } : undefined),
      paddingRight: caretPadRight,
    };

    return (
      <div
        ref={selectRef}
        className={wrapperClasses}
        {...props}
      >
        {label && (
          <label
            id={labelId}
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <button
          ref={triggerRef}
          id={selectId}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && activeIndex != null ? optionId(activeIndex) : undefined
          }
          aria-invalid={!!error || undefined}
          aria-errormessage={errorText ? errorId : undefined}
          aria-describedby={describedBy}
          aria-required={required || undefined}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? -1 : 0}
          className={cn(selectClasses, 'justify-start')}
          onClick={() => !disabled && setIsOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          style={triggerStyle}
        >
          <span
            className={cn(
              'block min-w-0 flex-1 text-left',
              truncateTriggerLabel && 'truncate',
              !selectedOption && 'text-gray-500'
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown
            className={cn(
              'absolute right-2 h-4 w-4 text-gray-400 transition-transform pointer-events-none',
              isOpen && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </button>

        {DropdownPortal()}

        {errorText && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600"
            aria-live="polite"
            aria-atomic="true"
          >
            {errorText}
          </p>
        )}
        {helperText && !errorText && (
          <p
            id={helperId}
            className="mt-1 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
export default Select;
