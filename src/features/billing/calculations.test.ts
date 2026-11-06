import { describe, expect, it } from "vitest";

import {
  addCadence,
  isBillingOverdue,
  paymentAdvancesPlan,
  periodCoveredByPayment,
} from "./calculations";

describe("billing periods", () => {
  it("covers a calendar month and rolls next due forward", () => {
    expect(periodCoveredByPayment("2026-11-01", "monthly")).toEqual({
      period_start: "2026-11-01",
      period_end: "2026-11-30",
      next_due_on: "2026-12-01",
    });
  });

  it("covers a quarter", () => {
    expect(periodCoveredByPayment("2026-01-01", "quarterly")).toEqual({
      period_start: "2026-01-01",
      period_end: "2026-03-31",
      next_due_on: "2026-04-01",
    });
  });

  it("covers a year", () => {
    expect(addCadence("2026-03-15", "yearly")).toBe("2027-03-15");
    expect(periodCoveredByPayment("2026-03-15", "yearly")).toEqual({
      period_start: "2026-03-15",
      period_end: "2027-03-14",
      next_due_on: "2027-03-15",
    });
  });

  it("treats a payment as the one that created the current due date", () => {
    expect(paymentAdvancesPlan("2026-12-01", "2026-11-01", "monthly")).toBe(true);
    expect(paymentAdvancesPlan("2027-01-01", "2026-11-01", "monthly")).toBe(false);
  });

  it("marks only active plans with a past due date as overdue", () => {
    expect(isBillingOverdue("2026-10-01", "2026-11-05", "active")).toBe(true);
    expect(isBillingOverdue("2026-12-01", "2026-11-05", "active")).toBe(false);
    expect(isBillingOverdue("2026-10-01", "2026-11-05", "paused")).toBe(false);
  });
});
