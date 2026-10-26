export type MeasurementChange = {
  start: number;
  current: number;
  change: number;
  percent: number | null;
};

export function measurementChange(
  start: number | null | undefined,
  current: number | null | undefined,
): MeasurementChange | null {
  if (start == null || current == null) return null;
  const change = current - start;
  const percent = start === 0 ? null : (change / start) * 100;
  return { start, current, change, percent };
}

export function firstAndLastNumeric(
  values: Array<number | null | undefined>,
): { first: number | null; last: number | null } {
  const numeric = values.filter((value): value is number => value != null);
  if (numeric.length === 0) return { first: null, last: null };
  return { first: numeric[0] ?? null, last: numeric[numeric.length - 1] ?? null };
}
