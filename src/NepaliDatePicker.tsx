import { format, parse, type BsDate, type Locale } from 'nepali-miti';
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
} from 'react';
import { NepaliCalendar, type NepaliCalendarProps } from './NepaliCalendar';
import { isDisabled, safeToday, sameDay } from './utils';

export interface NepaliDatePickerLabels {
  openCalendar: string;
  dialog: string;
  today: string;
  clear: string;
}

const DEFAULT_LABELS: Record<Locale, NepaliDatePickerLabels> = {
  en: { openCalendar: 'Choose date', dialog: 'Choose date', today: 'Today', clear: 'Clear' },
  ne: { openCalendar: 'मिति छान्नुहोस्', dialog: 'मिति छान्नुहोस्', today: 'आज', clear: 'हटाउनुहोस्' },
};

type InheritedCalendarProps = Pick<
  NepaliCalendarProps,
  'minDate' | 'maxDate' | 'isDateDisabled' | 'locale' | 'weekStartsOn' | 'showAdDates' | 'timeZone' | 'defaultMonth'
>;

export interface NepaliDatePickerProps extends InheritedCalendarProps {
  /** Selected date (controlled). Use `null` for "no date". */
  value?: BsDate | null | undefined;
  /** Initial date when uncontrolled. */
  defaultValue?: BsDate | null | undefined;
  /** Called with the new date, or `null` when the input is cleared. */
  onChange?: ((date: BsDate | null) => void) | undefined;
  /**
   * Display and typing pattern (see `format` in nepali-miti). Default `"YYYY-MM-DD"`.
   * Supported for typing: `YYYY`, `MMMM`, `MM`, `M`, `DD`, `D` and `[literal]` text.
   */
  format?: string | undefined;
  /** Name of a hidden input that submits the value as `YYYY-MM-DD` (ASCII digits) in forms. */
  name?: string | undefined;
  id?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  required?: boolean | undefined;
  /** Show a "Clear" button in the popup. Default `true`. */
  clearable?: boolean | undefined;
  /** Close the popup after a date is picked. Default `true`. */
  closeOnSelect?: boolean | undefined;
  /** Extra props for the text input (e.g. `aria-describedby`, `autoComplete`). */
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'value' | 'defaultValue' | 'onChange' | 'id' | 'name' | 'disabled' | 'required' | 'placeholder' | 'type'
  >;
  labels?: Partial<NepaliDatePickerLabels> | undefined;
  className?: string | undefined;
}

/**
 * A text input with a Bikram Sambat calendar popup. Users can type a date or pick one.
 *
 * @example
 * const [date, setDate] = useState<BsDate | null>(null);
 * <NepaliDatePicker value={date} onChange={setDate} />
 */
export function NepaliDatePicker(props: NepaliDatePickerProps) {
  const {
    value: controlledValue,
    defaultValue = null,
    onChange,
    format: pattern = 'YYYY-MM-DD',
    name,
    id,
    placeholder,
    disabled = false,
    required = false,
    clearable = true,
    closeOnSelect = true,
    inputProps,
    className,
    locale = 'ne',
    timeZone = 'local',
    minDate,
    maxDate,
    isDateDisabled,
  } = props;
  const labels = { ...DEFAULT_LABELS[locale], ...props.labels };

  const isControlled = controlledValue !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = useState<BsDate | null>(defaultValue);
  const value = isControlled ? controlledValue : uncontrolledValue;

  const display = useCallback((d: BsDate | null) => (d ? format(d, pattern, { locale }) : ''), [pattern, locale]);
  const [text, setText] = useState(() => display(value));
  const [open, setOpen] = useState(false);
  const [invalid, setInvalid] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const inputId = id ?? `${generatedId}-input`;
  const dialogId = `${generatedId}-dialog`;

  // Keep the text in sync when the value (or display pattern) changes from outside.
  // Compare by day, not object identity, so an inline `value={{ ... }}` does not reset typing.
  const valueKey = value ? `${value.year}-${value.month}-${value.day}` : '';
  useEffect(() => {
    setText(display(value));
    setInvalid(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `value` is represented by `valueKey`
  }, [valueKey, display]);

  const commit = (next: BsDate | null): void => {
    if (!isControlled) setUncontrolledValue(next);
    if (!sameDay(next, value) && (next !== null || value !== null)) onChange?.(next);
    setText(display(next));
    setInvalid(false);
  };

  const constraints = { minDate, maxDate, isDateDisabled };

  const commitText = (): void => {
    const trimmed = text.trim();
    if (trimmed === '') {
      commit(null);
      return;
    }
    try {
      const parsed = parse(trimmed, pattern);
      if (isDisabled(parsed, constraints)) throw new RangeError('disabled');
      commit(parsed);
    } catch {
      setInvalid(true);
    }
  };

  const close = (focusInput: boolean): void => {
    setOpen(false);
    if (focusInput) inputRef.current?.focus();
  };

  // Close when clicking outside.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent): void => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const onRootBlur = (event: FocusEvent<HTMLDivElement>): void => {
    const next = event.relatedTarget as Node | null;
    if (next && rootRef.current?.contains(next)) return;
    if (next) setOpen(false); // focus moved elsewhere on the page (e.g. Tab)
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    inputProps?.onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Enter') {
      commitText();
    } else if (event.key === 'ArrowDown' && (event.altKey || !open)) {
      event.preventDefault();
      setOpen(true);
    } else if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  const onDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      close(true);
    }
  };

  const today = safeToday(timeZone);
  const todaySelectable = today !== null && !isDisabled(today, constraints);

  return (
    <div
      ref={rootRef}
      className={['nmr-picker', className].filter(Boolean).join(' ')}
      data-open={open || undefined}
      onBlur={onRootBlur}
    >
      <div className="nmr-field">
        <input
          {...inputProps}
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="text"
          autoComplete={inputProps?.autoComplete ?? 'off'}
          className={['nmr-input', inputProps?.className].filter(Boolean).join(' ')}
          value={text}
          placeholder={placeholder ?? pattern}
          disabled={disabled}
          required={required}
          aria-invalid={invalid || inputProps?.['aria-invalid'] || undefined}
          onChange={(e) => {
            setText(e.target.value);
            setInvalid(false);
          }}
          onBlur={(e) => {
            inputProps?.onBlur?.(e);
            commitText();
          }}
          onKeyDown={onInputKeyDown}
        />
        <button
          type="button"
          className="nmr-toggle"
          aria-label={labels.openCalendar}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              fill="currentColor"
              d="M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3V2Zm12 8H5v9h14v-9ZM5 6v2h14V6H5Z"
            />
          </svg>
        </button>
      </div>
      {name !== undefined && <input type="hidden" name={name} value={value ? format(value, 'YYYY-MM-DD') : ''} />}

      {open && (
        <div
          id={dialogId}
          className="nmr-popover"
          role="dialog"
          aria-modal="false"
          aria-label={labels.dialog}
          onKeyDown={onDialogKeyDown}
        >
          <NepaliCalendar
            value={value}
            onChange={(date) => {
              commit(date);
              if (closeOnSelect) close(true);
            }}
            minDate={minDate}
            maxDate={maxDate}
            isDateDisabled={isDateDisabled}
            defaultMonth={props.defaultMonth}
            locale={locale}
            weekStartsOn={props.weekStartsOn}
            showAdDates={props.showAdDates}
            timeZone={timeZone}
            autoFocus
          />
          <div className="nmr-footer">
            <button
              type="button"
              className="nmr-action"
              disabled={!todaySelectable}
              onClick={() => {
                if (!today) return;
                commit(today);
                if (closeOnSelect) close(true);
              }}
            >
              {labels.today}
            </button>
            {clearable && (
              <button
                type="button"
                className="nmr-action"
                disabled={value === null}
                onClick={() => {
                  commit(null);
                  close(true);
                }}
              >
                {labels.clear}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
