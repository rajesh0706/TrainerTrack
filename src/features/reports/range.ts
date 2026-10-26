import { endOfMonth, startOfMonth, subMonths } from "date-fns";

import {
  isoDate,
  weekBounds,
  monthBounds,
} from "@/features/attendance/dates";

export type RangePreset = "this_week" | "this_month" | "last_3_months" | "custom";

export function rangeForPreset(preset: RangePreset, now = new Date()) {
  if (preset === "this_week") {
    const week = weekBounds(now);
    return { from: week.from, to: week.to };
  }
  if (preset === "this_month") {
    const month = monthBounds(now);
    return { from: month.from, to: month.to };
  }
  if (preset === "last_3_months") {
    return {
      from: isoDate(startOfMonth(subMonths(now, 2))),
      to: isoDate(endOfMonth(now)),
    };
  }
  const month = monthBounds(now);
  return { from: month.from, to: month.to };
}
