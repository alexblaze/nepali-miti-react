import {
  addDays,
  addMonths,
  compareBs,
  daysInBsMonth,
  getSupportedRange,
  getWeekday,
  today as bsToday,
  type BsDate,
  type TimeZoneMode,
} from 'nepali-miti';

export interface DateConstraints {
  minDate?: BsDate | undefined;
  maxDate?: BsDate | undefined;
  isDateDisabled?: ((date: BsDate) => boolean) | undefined;
}

/** Effective lower/upper bounds: the caller's limits intersected with the library's supported range. */
export function getBounds({ minDate, maxDate }: DateConstraints): { min: BsDate; max: BsDate } {
  const range = getSupportedRange();
  const min = minDate && compareBs(minDate, range.min) > 0 ? minDate : range.min;
  const max = maxDate && compareBs(maxDate, range.max) < 0 ? maxDate : range.max;
  return { min, max };
}

export function clampDate(date: BsDate, bounds: { min: BsDate; max: BsDate }): BsDate {
  if (compareBs(date, bounds.min) < 0) return bounds.min;
  if (compareBs(date, bounds.max) > 0) return bounds.max;
  return date;
}

export function isOutOfBounds(date: BsDate, bounds: { min: BsDate; max: BsDate }): boolean {
  return compareBs(date, bounds.min) < 0 || compareBs(date, bounds.max) > 0;
}

export function isDisabled(date: BsDate, constraints: DateConstraints): boolean {
  return isOutOfBounds(date, getBounds(constraints)) || Boolean(constraints.isDateDisabled?.(date));
}

export function sameDay(a: BsDate | null | undefined, b: BsDate | null | undefined): boolean {
  return Boolean(a && b && a.year === b.year && a.month === b.month && a.day === b.day);
}

export function dateKey(date: BsDate): string {
  return `${date.year}-${date.month}-${date.day}`;
}

/** Today's BS date, or `null` if it is outside the supported range. */
export function safeToday(timeZone: TimeZoneMode): BsDate | null {
  try {
    return bsToday({ timeZone });
  } catch {
    return null;
  }
}

/** Move by `days`, stopping at the bounds instead of throwing. */
export function moveDays(date: BsDate, days: number, bounds: { min: BsDate; max: BsDate }): BsDate {
  try {
    return clampDate(addDays(date, days), bounds);
  } catch {
    return days < 0 ? bounds.min : bounds.max;
  }
}

/** Move by `months` (day clamped to month length), stopping at the bounds instead of throwing. */
export function moveMonths(date: BsDate, months: number, bounds: { min: BsDate; max: BsDate }): BsDate {
  try {
    return clampDate(addMonths(date, months), bounds);
  } catch {
    return months < 0 ? bounds.min : bounds.max;
  }
}

/** First and last day of the week containing `date`. */
export function weekEdge(
  date: BsDate,
  edge: 'start' | 'end',
  weekStartsOn: number,
  bounds: { min: BsDate; max: BsDate },
): BsDate {
  const offset = (getWeekday(date) - weekStartsOn + 7) % 7;
  return moveDays(date, edge === 'start' ? -offset : 6 - offset, bounds);
}

/** `true` if the month has at least one day inside the bounds. */
export function monthInBounds(year: number, month: number, bounds: { min: BsDate; max: BsDate }): boolean {
  const first = { year, month, day: 1 };
  let last: BsDate;
  try {
    last = { year, month, day: daysInBsMonth(year, month) };
  } catch {
    return false;
  }
  return compareBs(last, bounds.min) >= 0 && compareBs(first, bounds.max) <= 0;
}
