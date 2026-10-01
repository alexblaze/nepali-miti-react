import {
  BS_MONTHS,
  WEEKDAYS,
  WEEKDAYS_SHORT,
  format,
  getMonthGrid,
  toNepaliDigits,
  type BsDate,
  type Locale,
  type MonthGridDay,
  type TimeZoneMode,
} from 'nepali-miti';
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  clampDate,
  dateKey,
  getBounds,
  isDisabled,
  monthInBounds,
  moveDays,
  moveMonths,
  safeToday,
  sameDay,
  weekEdge,
  type DateConstraints,
} from './utils';

export interface NepaliCalendarLabels {
  previousMonth: string;
  nextMonth: string;
  month: string;
  year: string;
}

const DEFAULT_LABELS: Record<Locale, NepaliCalendarLabels> = {
  en: { previousMonth: 'Previous month', nextMonth: 'Next month', month: 'Month', year: 'Year' },
  ne: { previousMonth: 'अघिल्लो महिना', nextMonth: 'अर्को महिना', month: 'महिना', year: 'साल' },
};

export interface NepaliCalendarProps {
  /** The selected date. */
  value?: BsDate | null | undefined;
  /** Called when the user picks a date (click, Enter or Space). */
  onChange?: ((date: BsDate) => void) | undefined;
  /** Earliest selectable date (inclusive). */
  minDate?: BsDate | undefined;
  /** Latest selectable date (inclusive). */
  maxDate?: BsDate | undefined;
  /** Return `true` to disable a date (e.g. Saturdays or public holidays). */
  isDateDisabled?: ((date: BsDate) => boolean) | undefined;
  /** Month shown first when there is no `value`. Defaults to the month of today. */
  defaultMonth?: { year: number; month: number } | undefined;
  /** Names and digits: `"ne"` (default) or `"en"`. */
  locale?: Locale | undefined;
  /** 0 = Sunday (default, as on Nepali calendars) … 6 = Saturday. */
  weekStartsOn?: number | undefined;
  /** Show the Gregorian day number under each BS day. Default `true`. */
  showAdDates?: boolean | undefined;
  /** Timezone used to work out "today". Default `"local"`. */
  timeZone?: TimeZoneMode | undefined;
  /** Move keyboard focus into the grid when the calendar mounts. */
  autoFocus?: boolean | undefined;
  /** Override the accessible labels of the navigation controls. */
  labels?: Partial<NepaliCalendarLabels> | undefined;
  className?: string | undefined;
}

const AD_FORMAT = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

function adLabel(cell: MonthGridDay): string {
  return AD_FORMAT.format(new Date(Date.UTC(cell.ad.year, cell.ad.month - 1, cell.ad.day)));
}

/**
 * An inline Bikram Sambat month calendar with full keyboard support
 * (arrow keys, Home/End, PageUp/PageDown, Shift+PageUp/PageDown).
 */
export function NepaliCalendar(props: NepaliCalendarProps) {
  const {
    value = null,
    onChange,
    minDate,
    maxDate,
    isDateDisabled,
    defaultMonth,
    locale = 'ne',
    weekStartsOn = 0,
    showAdDates = true,
    timeZone = 'local',
    autoFocus = false,
    className,
  } = props;
  const labels = { ...DEFAULT_LABELS[locale], ...props.labels };
  const constraints: DateConstraints = { minDate, maxDate, isDateDisabled };
  const bounds = getBounds(constraints);
  const today = safeToday(timeZone);

  const initialFocus = (): BsDate => {
    if (value) return clampDate(value, bounds);
    if (defaultMonth) return clampDate({ ...defaultMonth, day: 1 }, bounds);
    return clampDate(today ?? bounds.min, bounds);
  };
  const [focused, setFocused] = useState<BsDate>(initialFocus);
  const shouldFocus = useRef(autoFocus);
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const headingId = useId();

  // Follow external value changes.
  const valueKey = value ? dateKey(value) : '';
  useEffect(() => {
    if (value) setFocused(clampDate(value, bounds));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when the selected day changes
  }, [valueKey]);

  useEffect(() => {
    if (!shouldFocus.current) return;
    shouldFocus.current = false;
    cellRefs.current.get(dateKey(focused))?.focus();
  }, [focused]);

  const weeks = useMemo(
    () => getMonthGrid(focused.year, focused.month, { weekStartsOn, fillWeeks: false }),
    [focused.year, focused.month, weekStartsOn],
  );

  const digits = (n: number): string => (locale === 'ne' ? toNepaliDigits(n) : String(n));

  const moveFocus = (next: BsDate, focusCell = true): void => {
    shouldFocus.current = focusCell;
    setFocused(next);
  };

  const select = (date: BsDate): void => {
    if (isDisabled(date, constraints)) return;
    onChange?.(date);
  };

  const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>): void => {
    let next: BsDate;
    switch (event.key) {
      case 'ArrowLeft':
        next = moveDays(focused, -1, bounds);
        break;
      case 'ArrowRight':
        next = moveDays(focused, 1, bounds);
        break;
      case 'ArrowUp':
        next = moveDays(focused, -7, bounds);
        break;
      case 'ArrowDown':
        next = moveDays(focused, 7, bounds);
        break;
      case 'Home':
        next = weekEdge(focused, 'start', weekStartsOn, bounds);
        break;
      case 'End':
        next = weekEdge(focused, 'end', weekStartsOn, bounds);
        break;
      case 'PageUp':
        next = moveMonths(focused, event.shiftKey ? -12 : -1, bounds);
        break;
      case 'PageDown':
        next = moveMonths(focused, event.shiftKey ? 12 : 1, bounds);
        break;
      default:
        return;
    }
    event.preventDefault();
    moveFocus(next);
  };

  const prevMonth = moveMonths(focused, -1, bounds);
  const nextMonth = moveMonths(focused, 1, bounds);
  const canPrev = prevMonth.year !== focused.year || prevMonth.month !== focused.month;
  const canNext = nextMonth.year !== focused.year || nextMonth.month !== focused.month;

  const years: number[] = [];
  for (let y = bounds.min.year; y <= bounds.max.year; y++) years.push(y);

  const weekdayOrder = Array.from({ length: 7 }, (_, i) => (i + weekStartsOn) % 7);

  return (
    <div className={['nmr-calendar', className].filter(Boolean).join(' ')} lang={locale === 'ne' ? 'ne' : 'en'}>
      <div className="nmr-header">
        <button
          type="button"
          className="nmr-nav"
          aria-label={labels.previousMonth}
          disabled={!canPrev}
          onClick={() => moveFocus(prevMonth, false)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <h2 id={headingId} className="nmr-heading" aria-live="polite">
          {format(focused, 'MMMM YYYY', { locale })}
        </h2>
        <div className="nmr-selects">
          <select
            className="nmr-select"
            aria-label={labels.month}
            value={focused.month}
            onChange={(e) => moveFocus(moveMonths(focused, Number(e.target.value) - focused.month, bounds), false)}
          >
            {BS_MONTHS[locale].map((name, i) => (
              <option key={name} value={i + 1} disabled={!monthInBounds(focused.year, i + 1, bounds)}>
                {name}
              </option>
            ))}
          </select>
          <select
            className="nmr-select"
            aria-label={labels.year}
            value={focused.year}
            onChange={(e) =>
              moveFocus(moveMonths(focused, (Number(e.target.value) - focused.year) * 12, bounds), false)
            }
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {digits(y)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="nmr-nav"
          aria-label={labels.nextMonth}
          disabled={!canNext}
          onClick={() => moveFocus(nextMonth, false)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <table className="nmr-grid" role="grid" aria-labelledby={headingId} onKeyDown={onGridKeyDown}>
        <thead>
          <tr>
            {weekdayOrder.map((d) => (
              <th key={d} scope="col" abbr={WEEKDAYS[locale][d]} data-weekend={d === 6 || undefined}>
                {WEEKDAYS_SHORT[locale][d]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, w) => (
            <tr key={w}>
              {week.map((cell, i) => {
                if (!cell) return <td key={i} className="nmr-empty" />;
                const key = dateKey(cell.bs);
                const selected = sameDay(cell.bs, value);
                const disabled = isDisabled(cell.bs, constraints);
                const isToday = sameDay(cell.bs, today);
                const isFocused = sameDay(cell.bs, focused);
                return (
                  <td key={i} role="gridcell" aria-selected={selected}>
                    <button
                      type="button"
                      ref={(el) => {
                        if (el) cellRefs.current.set(key, el);
                        else cellRefs.current.delete(key);
                      }}
                      className="nmr-day"
                      tabIndex={isFocused ? 0 : -1}
                      aria-disabled={disabled || undefined}
                      aria-current={isToday ? 'date' : undefined}
                      aria-label={`${format(cell.bs, 'dddd, D MMMM YYYY', { locale })} (${adLabel(cell)})`}
                      data-selected={selected || undefined}
                      data-today={isToday || undefined}
                      data-weekend={cell.weekday === 6 || undefined}
                      onClick={() => {
                        setFocused(cell.bs);
                        select(cell.bs);
                      }}
                      onFocus={() => {
                        if (!isFocused) setFocused(cell.bs);
                      }}
                    >
                      <span className="nmr-bs">{digits(cell.bs.day)}</span>
                      {showAdDates && (
                        <span className="nmr-ad" aria-hidden="true">
                          {cell.ad.day}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
