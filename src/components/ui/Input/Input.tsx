'use client';

import type React from 'react';
import {
  forwardRef,
  useEffect,
  useId,
  useState,
  useLayoutEffect,
  useRef,
} from 'react';
import { useFormControl } from '../FormControl/FormControl';
import { Select } from '../Select/Select';

export interface InputSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  // Core props
  label?: string;
  error?: string;
  helperText?: string;
  variant?:
    | 'default'
    | 'underline'
    | 'filled'
    | 'outlined'
    | 'ghost'
    | 'floating'
    | 'inset';
  inputSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showFocusRing?: boolean;
  disableFocusStyles?: boolean;

  // Icons
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;

  // Adornments / inline elements
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;

  // Inline elements
  inlineSelect?: {
    options: InputSelectOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    position?: 'left' | 'right';
  };
  inlineButton?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
  };
  inlineLabel?: {
    text: string;
    position?: 'left' | 'right';
  };
  inlineAddOn?: {
    content: React.ReactNode;
    position?: 'left' | 'right';
  };

  // Layout
  fullWidth?: boolean;
  width?: string;

  // State overrides
  disabled?: boolean;
  required?: boolean;
}

/** Fixed geometry for deterministic spacing (icons) */
const ICON_PX = { xs: 12, sm: 16, md: 20, lg: 24, xl: 28 } as const;
const TEXT_GAP = 12; // text ↔ icon
const BORDER_GAP = 12; // icon ↔ border
const reserveForIcon = (s: keyof typeof ICON_PX) =>
  BORDER_GAP + ICON_PX[s] + TEXT_GAP;

/** Base vertical paddings (px) per size */
const BASE_VPAD_PX = { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 } as const;
/** Extra headroom for INSET */
const INSET_EXTRA_TOP_PX = { xs: 6, sm: 8, md: 10, lg: 12, xl: 14 } as const;
/** Wrapper minimum heights (px) approx to h-7/9/10/12/14 */
const WRAPPER_MIN_H_PX = { xs: 28, sm: 36, md: 40, lg: 48, xl: 56 } as const;
/** Extra wrapper headroom for INSET */
const INSET_EXTRA_MIN_H_PX = { xs: 2, sm: 4, md: 6, lg: 8, xl: 10 } as const;

/** Inset label top offsets (px) per size */
const INSET_LABEL_BASE_TOP_PX = {
  xs: 7,
  sm: 11,
  md: 15,
  lg: 20,
  xl: 22,
} as const;
const INSET_LABEL_ACTIVE_TOP_PX = {
  xs: 0,
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
} as const;

/** Visual scale (no height/py here) */
const sizeScale = {
  xs: { text: 'text-xs', iconBox: 'w-3 h-3', label: 'text-xs' },
  sm: { text: 'text-sm', iconBox: 'w-4 h-4', label: 'text-sm' },
  md: { text: 'text-base', iconBox: 'w-5 h-5', label: 'text-sm' },
  lg: { text: 'text-lg', iconBox: 'w-6 h-6', label: 'text-base' },
  xl: { text: 'text-xl', iconBox: 'w-7 h-7', label: 'text-lg' },
} as const;

/** Start adornment: smaller assumed box + tighter gap so value/placeholder aren't overly indented */
const START_ADORN_BOX_PX = { xs: 10, sm: 12, md: 16, lg: 18, xl: 20 } as const;
const START_TEXT_GAP = 8;

/** Right-side adornments can stay a bit roomier (unchanged) */
const END_ADORN_BOX_PX = { xs: 28, sm: 32, md: 36, lg: 40, xl: 44 } as const;

const INLINE_LABEL_BOX_PX = { xs: 28, sm: 32, md: 36, lg: 40, xl: 44 } as const; // short inline label
const INLINE_SELECT_MIN_W = 80; // matches min-w-[80px]
const INLINE_SELECT_MAX_W = 140; // matches max-w-[140px]

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error: errorProp,
      helperText,
      variant = 'default',
      inputSize = 'md',
      showFocusRing = false,
      disableFocusStyles = false,
      startIcon,
      endIcon,
      startAdornment,
      endAdornment,
      inlineSelect,
      inlineButton,
      inlineLabel,
      inlineAddOn,
      fullWidth = false,
      type = 'text',
      id: idProp,
      disabled: disabledProp,
      required: requiredProp,
      placeholder,
      value,
      onChange,
      onFocus,
      onBlur,
      width,
      ...props
    },
    ref
  ) => {
    const formControl = useFormControl();
    const [focused, setFocused] = useState(false);
    const [hasValue, setHasValue] = useState(false);
    const stableId = useId();

    // Inherit from FormControl context, but allow props to override
    const error = errorProp ?? formControl?.error ?? false;
    const disabled = disabledProp ?? formControl?.disabled ?? false;
    const required = requiredProp ?? formControl?.required ?? false;

    const inputId = idProp || formControl?.inputId || `input-${stableId}`;

    // === A11y: derive helper/error IDs and describedby ===
    const helperId = helperText ? `${inputId}-help` : undefined;
    const errorText = typeof error === 'string' ? error : undefined;
    const errorId = errorText ? `${inputId}-error` : undefined;
    const describedBy =
      [
        (props['aria-describedby'] as string | undefined) || undefined,
        helperId,
        errorText ? errorId : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    // track value presence (for floating/inset label)
    useEffect(() => {
      const currentValue = value ?? '';
      setHasValue(String(currentValue).length > 0);
    }, [value]);

    // Handle focus
    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(event);
    };

    // Handle blur
    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    };

    // Handle change to track value state
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(event.target.value.length > 0);
      onChange?.(event);
    };

    /** Wrapper (not the input) renders variant visuals + focus-within state */
    const focusRing =
      !disableFocusStyles && showFocusRing
        ? 'focus-within:ring-2 focus-within:ring-blue-500/50'
        : '';
    const disabledCls = disabled ? 'opacity-50 cursor-not-allowed' : '';
    const overflowCls =
      variant === 'floating' ? 'overflow-visible' : 'overflow-hidden'; // allow floating chip to cross border

    const variantCls = (() => {
      const err = !!error;
      switch (variant) {
        case 'underline':
          return `${focusRing} ${disabledCls} bg-transparent border-b-2 ${
            err ? 'border-b-red-500' : 'border-b-gray-300'
          } focus-within:border-b-blue-500 rounded-none`;
        case 'filled':
          return `${focusRing} ${disabledCls} bg-gray-100 border ${
            err ? 'border-red-500' : 'border-gray-300'
          } focus-within:border-blue-500 rounded-md`;
        case 'outlined':
          return `${focusRing} ${disabledCls} bg-white border-2 ${
            err ? 'border-red-500' : 'border-gray-300'
          } focus-within:border-blue-500 rounded-md`;
        case 'ghost':
          return `${focusRing} ${disabledCls} bg-transparent border ${
            err ? 'border-red-500' : 'border-transparent'
          } hover:bg-gray-100 focus-within:border-blue-500 rounded-md`;
        case 'floating':
          return `${focusRing} ${disabledCls} bg-white border ${
            err ? 'border-red-500' : 'border-gray-300'
          } focus-within:border-blue-500 rounded-md`;
        case 'inset':
          return `${focusRing} ${disabledCls} bg-white border ${
            err ? 'border-red-500' : 'border-gray-300'
          } focus-within:border-blue-500 rounded-md`;
        case 'default':
        default:
          return `${focusRing} ${disabledCls} bg-white border ${
            err ? 'border-red-500' : 'border-gray-300'
          } focus-within:border-blue-500 rounded-md`;
      }
    })();

    const containerClasses = `${fullWidth ? 'w-full' : width ? width : 'w-64'}`;

    /** Flush-corner logic for wrapper.
     * Keep wrapper rounding when inlineSelect is present so the select's OUTER corners remain rounded.
     */
    const leftFlush = inlineAddOn?.position === 'left';
    const rightFlush = inlineAddOn?.position === 'right' || !!inlineButton;

    // Wrapper base + variant, then override side rounding if needed
    const wrapperBase = `group relative ${overflowCls} transition-colors ${variantCls}`;
    const wrapperClasses = `${wrapperBase} ${className} ${
      leftFlush ? 'rounded-l-none' : ''
    } ${rightFlush ? 'rounded-r-none' : ''}`;

    /** ---------- InlineSelect width measurement (only) to avoid over/under indent on number type ---------- */
    const leftSelectRef = useRef<HTMLDivElement | null>(null);
    const rightSelectRef = useRef<HTMLDivElement | null>(null);
    const [leftSelectW, setLeftSelectW] = useState(0);
    const [rightSelectW, setRightSelectW] = useState(0);

    useLayoutEffect(() => {
      const L = leftSelectRef.current;
      const R = rightSelectRef.current;

      const measure = () => {
        if (L) setLeftSelectW(L.offsetWidth || 0);
        if (R) setRightSelectW(R.offsetWidth || 0);
      };
      measure();

      const RO = (window as any).ResizeObserver
        ? new ResizeObserver(measure)
        : null;
      if (RO && L) RO.observe(L);
      if (RO && R) RO.observe(R);
      return () => {
        if (RO && L) RO.unobserve(L);
        if (RO && R) RO.unobserve(R);
      };
      // re-check when side flips
    }, [inlineSelect?.position]);

    /** Deterministic input padding for inline/icon scenarios (both sides) */
    const leftPadCandidates: number[] = [
      BORDER_GAP,
      startIcon ? reserveForIcon(inputSize) : 0,
      // Start adornment: smaller assumed width + tighter gap to reduce indent
      startAdornment
        ? BORDER_GAP + START_ADORN_BOX_PX[inputSize] + START_TEXT_GAP
        : 0,
      inlineLabel?.position === 'left'
        ? BORDER_GAP + INLINE_LABEL_BOX_PX[inputSize] + TEXT_GAP
        : 0,
      // InlineSelect LEFT: use measured width when available; fallback to max bound
      inlineSelect?.position === 'left'
        ? BORDER_GAP +
          (leftSelectW > 0 ? leftSelectW : INLINE_SELECT_MAX_W) +
          TEXT_GAP
        : 0,
    ];

    const rightPadCandidates: number[] = [
      BORDER_GAP,
      endIcon ? reserveForIcon(inputSize) : 0,
      endAdornment ? BORDER_GAP + END_ADORN_BOX_PX[inputSize] + TEXT_GAP : 0,
      inlineLabel?.position === 'right'
        ? BORDER_GAP + INLINE_LABEL_BOX_PX[inputSize] + TEXT_GAP
        : 0,
      // InlineSelect RIGHT: use measured width when available; fallback to max bound
      inlineSelect?.position === 'right'
        ? BORDER_GAP +
          (rightSelectW > 0 ? rightSelectW : INLINE_SELECT_MAX_W) +
          TEXT_GAP
        : 0,
    ];

    const pl = Math.max(...leftPadCandidates);
    const pr = Math.max(...rightPadCandidates);

    /** Inline-computed wrapper min-height; give INSET a little extra */
    const wrapperMinH =
      WRAPPER_MIN_H_PX[inputSize] +
      (variant === 'inset' ? INSET_EXTRA_MIN_H_PX[inputSize] : 0);

    /** Base input classes (no border; wrapper owns visuals; vertical padding inline) */
    const inputClasses = `${sizeScale[inputSize].text} w-full bg-transparent outline-none border-0 text-gray-900 placeholder:text-gray-400 disabled:text-gray-500`;

    /** Vertical paddings (px) */
    const pt =
      BASE_VPAD_PX[inputSize] +
      (variant === 'inset' ? INSET_EXTRA_TOP_PX[inputSize] : 0);
    const pb = BASE_VPAD_PX[inputSize];

    /** Floating/inset label classes — aligned and unclipped */
    const labelIsFloating = variant === 'floating' || variant === 'inset';
    const isActive = focused || hasValue;
    const err = !!error;

    const commonLabelBase =
      'absolute pointer-events-none select-none transition-all duration-200 ease-out origin-left ' +
      sizeScale[inputSize].label;

    // Floating label
    const floatingBaseCls = `${commonLabelBase} ${
      err ? 'text-red-600' : 'text-gray-500'
    }`;
    const floatingActiveCls = `${commonLabelBase} ${
      focused ? 'text-blue-600' : err ? 'text-red-600' : 'text-gray-600'
    } bg-white px-1`;

    // Inset label (xs active will be overridden to exactly 8px)
    const insetBaseCls = `${commonLabelBase} ${
      err ? 'text-red-600' : 'text-gray-500'
    }`;
    const insetActiveCls = `${commonLabelBase} ${
      focused ? 'text-blue-600' : err ? 'text-red-600' : 'text-gray-600'
    }`;

    const renderFloatingOrInsetLabel = () => {
      if (!label || !labelIsFloating) return null;

      if (variant === 'floating') {
        return (
          <label
            htmlFor={inputId}
            className={isActive ? floatingActiveCls : floatingBaseCls}
            style={
              isActive
                ? {
                    left: pl, // align with text start
                    top: 0,
                    transform: 'translateY(-50%) scale(0.75)',
                  }
                : { left: pl, top: '50%', transform: 'translateY(-50%)' }
            }
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        );
      }

      // INSET: base sits a bit lower; active uses same 0.75 scale (xs uses explicit 8px)
      const isXS = inputSize === 'xs';
      const activeStyleXS = isXS
        ? {
            left: pl,
            top: INSET_LABEL_ACTIVE_TOP_PX[inputSize],
            transform: 'none',
            transformOrigin: 'left top',
            fontSize: '8px',
          }
        : {
            left: pl,
            top: INSET_LABEL_ACTIVE_TOP_PX[inputSize],
            transform: 'scale(0.75)',
            transformOrigin: 'left top',
          };

      return (
        <label
          htmlFor={inputId}
          className={isActive ? insetActiveCls : insetBaseCls}
          style={
            isActive
              ? activeStyleXS
              : {
                  left: pl,
                  top: INSET_LABEL_BASE_TOP_PX[inputSize],
                  transformOrigin: 'left top',
                }
          }
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      );
    };

    /** Inline helpers */
    // Inline Select with outer-corner rounding and inner divider
    const renderInlineSelect = () => {
      if (!inlineSelect) return null;
      const position = inlineSelect.position || 'left';
      const isLeft = position === 'left';

      const railBase =
        'absolute inset-y-0 flex items-stretch bg-white overflow-hidden'; // bg matches wrapper
      const railPos = isLeft ? 'left-0' : 'right-0';
      const railRound = isLeft
        ? 'rounded-l-md rounded-r-none'
        : 'rounded-r-md rounded-l-none';
      const railCls = `${railBase} ${railPos} ${railRound}`;

      const dividerPos = isLeft ? 'right-0' : 'left-0';

      return (
        <div
          ref={isLeft ? leftSelectRef : rightSelectRef}
          className={railCls}
        >
          <Select
            options={inlineSelect.options}
            value={inlineSelect.value}
            onChange={(v) => inlineSelect.onChange?.(v)}
            placeholder={inlineSelect.placeholder}
            disabled={disabled}
            size="sm"
            variant="ghost"
            className={`h-full border-0 bg-transparent shadow-none min-w-[${INLINE_SELECT_MIN_W}px] w-auto max-w-[${INLINE_SELECT_MAX_W}px] ${
              isLeft
                ? 'rounded-l-md rounded-r-none'
                : 'rounded-r-md rounded-l-none'
            }`}
          />
          <span
            aria-hidden
            className={`absolute ${dividerPos} top-0 bottom-0 w-px bg-gray-300 group-focus-within:bg-blue-500`}
          />
        </div>
      );
    };

    const renderInlineLabel = () => {
      if (!inlineLabel) return null;
      const position = inlineLabel.position || 'left';
      const cls =
        position === 'left'
          ? 'pointer-events-none absolute inset-y-0 left-0 flex items-center px-2.5 text-gray-500'
          : 'pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500';
      return <div className={cls}>{inlineLabel.text}</div>;
    };

    const renderInlineAddOn = () => {
      if (!inlineAddOn) return null;
      const position = inlineAddOn.position || 'right';
      const cls =
        position === 'left'
          ? 'inset-y-0 left-0 flex items-center rounded-md rounded-r-none border border-r-0 border-gray-300 bg-gray-100 px-2.5 text-gray-700'
          : 'inset-y-0 right-0 flex items-center rounded-md rounded-l-none border border-l-0 border-gray-300 bg-gray-100 px-2.5 text-gray-700';
      return <div className={cls}>{inlineAddOn.content}</div>;
    };

    const needsFlexWrapper = inlineAddOn || inlineButton;

    return (
      <div className={containerClasses}>
        {/* Standard label */}
        {label && !(variant === 'floating' || variant === 'inset') && (
          <label
            htmlFor={inputId}
            className={`mb-1 block ${sizeScale[inputSize].label} font-medium text-gray-700 cursor-pointer`}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Row container (for inline add-on/button) */}
        {needsFlexWrapper ? (
          <div className="relative z-0 flex">
            {/* Left side add-on */}
            {inlineAddOn?.position === 'left' && renderInlineAddOn()}

            {/* Wrapper owns the border/background; min-height inline so INSET can be taller */}
            <div
              className={`relative flex-1 ${wrapperClasses}`}
              style={{ minHeight: wrapperMinH }}
            >
              {/* Floating/Inset Label */}
              {renderFloatingOrInsetLabel()}

              {/* Inline Select / Label */}
              {renderInlineSelect()}
              {renderInlineLabel()}

              {/* Start Adornment */}
              {startAdornment && (
                <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-500">
                  {startAdornment}
                </div>
              )}

              {/* Start Icon — fixed 12px from border, centered in icon box */}
              {startIcon && (
                <div
                  className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none"
                  style={{ left: BORDER_GAP, width: ICON_PX[inputSize] }}
                  aria-hidden="true"
                >
                  <div
                    className={`${sizeScale[inputSize].iconBox} text-gray-400`}
                  >
                    {startIcon}
                  </div>
                </div>
              )}

              {/* End Icon — fixed 12px from border, centered in icon box */}
              {endIcon && (
                <div
                  className="absolute inset-y-0 right-0 flex items-center justify-center pointer-events-none"
                  style={{ right: BORDER_GAP, width: ICON_PX[inputSize] }}
                  aria-hidden="true"
                >
                  <div
                    className={`${sizeScale[inputSize].iconBox} text-gray-400`}
                  >
                    {endIcon}
                  </div>
                </div>
              )}

              {/* End Adornment */}
              {endAdornment && (
                <div className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  {endAdornment}
                </div>
              )}

              {/* Input (no border; wrapper owns visuals). Padding reserves icon/inline space deterministically. */}
              <input
                ref={ref}
                id={inputId}
                type={type}
                className={inputClasses}
                style={{
                  paddingLeft: pl,
                  paddingRight: pr,
                  paddingTop: pt,
                  paddingBottom: pb,
                }}
                placeholder={
                  variant === 'floating' || variant === 'inset'
                    ? focused || hasValue
                      ? placeholder ?? ''
                      : ' '
                    : placeholder ?? ''
                }
                disabled={disabled}
                required={required}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                aria-invalid={!!error || undefined}
                aria-required={required || undefined}
                aria-disabled={disabled || undefined}
                aria-errormessage={errorText ? errorId : undefined}
                aria-describedby={describedBy}
                {...props}
              />
            </div>

            {/* Right side add-on or button */}
            {inlineAddOn?.position === 'right' && renderInlineAddOn()}
            {inlineButton && (
              <button
                type="button"
                onClick={inlineButton.onClick}
                className="flex items-center space-x-1 rounded-md rounded-l-none border border-l-0 border-gray-300 px-2.5 text-gray-700 hover:bg-gray-100"
                disabled={disabled}
              >
                {inlineButton.icon && inlineButton.icon}
                <span>{inlineButton.label}</span>
              </button>
            )}
          </div>
        ) : (
          <div
            className={`relative ${wrapperClasses}`}
            style={{ minHeight: wrapperMinH }}
          >
            {/* Floating/Inset Label */}
            {renderFloatingOrInsetLabel()}

            {/* Inline Select */}
            {renderInlineSelect()}

            {/* Inline Label */}
            {renderInlineLabel()}

            {/* Start Adornment */}
            {startAdornment && (
              <div className="absolute inset-y-0 left-0 flex items-center px-3 text-gray-500">
                {startAdornment}
              </div>
            )}

            {/* Start Icon */}
            {startIcon && (
              <div
                className="absolute inset-y-0 left-0 flex items-center justify-center pointer-events-none"
                style={{ left: BORDER_GAP, width: ICON_PX[inputSize] }}
                aria-hidden="true"
              >
                <div
                  className={`${sizeScale[inputSize].iconBox} text-gray-400`}
                >
                  {startIcon}
                </div>
              </div>
            )}

            {/* End Icon */}
            {endIcon && (
              <div
                className="absolute inset-y-0 right-0 flex items-center justify-center pointer-events-none"
                style={{ right: BORDER_GAP, width: ICON_PX[inputSize] }}
                aria-hidden="true"
              >
                <div
                  className={`${sizeScale[inputSize].iconBox} text-gray-400`}
                >
                  {endIcon}
                </div>
              </div>
            )}

            {/* End Adornment */}
            {endAdornment && (
              <div className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                {endAdornment}
              </div>
            )}

            {/* Input */}
            <input
              ref={ref}
              id={inputId}
              type={type}
              className={inputClasses}
              style={{
                paddingLeft: pl,
                paddingRight: pr,
                paddingTop: pt,
                paddingBottom: pb,
              }}
              placeholder={
                variant === 'floating' || variant === 'inset'
                  ? focused || hasValue
                    ? placeholder ?? ''
                    : ' '
                  : placeholder ?? ''
              }
              disabled={disabled}
              required={required}
              value={value}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              aria-invalid={!!error || undefined}
              aria-required={required || undefined}
              aria-disabled={disabled || undefined}
              aria-errormessage={errorText ? errorId : undefined}
              aria-describedby={describedBy}
              {...props}
            />
          </div>
        )}

        {/* Helper / Error Text (live region) */}
        {(helperText || errorText) && (
          <div
            id={errorText ? errorId : helperId}
            className={`mt-1 ${sizeScale[inputSize].label} ${
              error ? 'text-red-600' : 'text-gray-500'
            }`}
            aria-live="polite"
            aria-atomic="true"
          >
            {errorText || helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
