import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export const WEEK_STARTS_ON = 1 as const;

export function isoDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

export function parseIsoDate(value: string) {
  return parseISO(`${value}T00:00:00`);
}

export function monthKey(value: Date) {
  return format(value, "yyyy-MM");
}

export function parseMonthKey(value: string | undefined, fallback = new Date()) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return startOfMonth(fallback);
  const parsed = parseISO(`${value}-01T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return startOfMonth(fallback);
  return startOfMonth(parsed);
}

export function monthBounds(month: Date) {
  return {
    from: isoDate(startOfMonth(month)),
    to: isoDate(endOfMonth(month)),
    previous: monthKey(addMonths(month, -1)),
    next: monthKey(addMonths(month, 1)),
  };
}

export function weekBounds(day: Date) {
  const start = startOfWeek(day, { weekStartsOn: WEEK_STARTS_ON });
  const end = endOfWeek(day, { weekStartsOn: WEEK_STARTS_ON });
  return { from: isoDate(start), to: isoDate(end), start, end };
}

export function shiftIsoDate(value: string, days: number) {
  return isoDate(addDays(parseIsoDate(value), days));
}

export function normalizeTime(value: string) {
  return value.length === 5 ? `${value}:00` : value.slice(0, 8);
}
