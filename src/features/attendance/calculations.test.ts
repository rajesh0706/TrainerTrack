import { describe, expect, it } from "vitest";

import { summarizeAttendance } from "./calculations";

describe("summarizeAttendance", () => {
  it("excludes cancelled and scheduled sessions from the percentage denominator", () => {
    const summary = summarizeAttendance([
      "attended",
      "attended",
      "missed",
      "late",
      "cancelled",
      "scheduled",
    ]);

    expect(summary.total).toBe(6);
    expect(summary.planned).toBe(1);
    expect(summary.scheduled).toBe(4);
    expect(summary.present).toBe(3);
    expect(summary.rate).toBe(75);
  });

  it("returns a null rate when there are no countable sessions", () => {
    expect(summarizeAttendance([]).rate).toBeNull();
    expect(summarizeAttendance(["cancelled", "scheduled"]).rate).toBeNull();
  });

  it("counts late as present", () => {
    const summary = summarizeAttendance(["late", "late", "missed"]);
    expect(summary.rate).toBeCloseTo((2 / 3) * 100);
  });
});
