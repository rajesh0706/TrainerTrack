import { format, parseISO } from "date-fns";

export function formatTime(value: string | null | undefined) {
  if (!value) return "—";
  return value.slice(0, 5);
}

export function formatDate(value: string | null | undefined, pattern = "d MMM yyyy") {
  if (!value) return "—";
  const parsed = parseISO(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return format(parsed, pattern);
}

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions,
) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", options).format(value);
}

export function formatKg(value: number | null | undefined) {
  if (value == null) return "—";
  return `${formatNumber(value, { maximumFractionDigits: 1 })} kg`;
}

export function formatCm(value: number | null | undefined) {
  if (value == null) return "—";
  return `${formatNumber(value, { maximumFractionDigits: 1 })} cm`;
}

export function formatPercent(value: number | null | undefined, digits = 0) {
  if (value == null) return "—";
  return `${formatNumber(value, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`;
}

export function signedNumber(value: number | null | undefined, digits = 1) {
  if (value == null) return "—";
  const formatted = formatNumber(Math.abs(value), { maximumFractionDigits: digits });
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}
