import { describe, expect, it } from "vitest";

import { firstAndLastNumeric, measurementChange } from "./calculations";

describe("measurementChange", () => {
  it("computes absolute and percent change", () => {
    const change = measurementChange(80, 76);
    expect(change).toEqual({
      start: 80,
      current: 76,
      change: -4,
      percent: -5,
    });
  });

  it("returns null when a value is missing", () => {
    expect(measurementChange(null, 70)).toBeNull();
    expect(measurementChange(70, undefined)).toBeNull();
  });

  it("returns a null percent when the start value is zero", () => {
    expect(measurementChange(0, 5)).toEqual({
      start: 0,
      current: 5,
      change: 5,
      percent: null,
    });
  });
});

describe("firstAndLastNumeric", () => {
  it("skips nulls and keeps chronological first/last", () => {
    expect(firstAndLastNumeric([null, 82, 81, undefined, 79])).toEqual({
      first: 82,
      last: 79,
    });
  });

  it("returns nulls for an empty series", () => {
    expect(firstAndLastNumeric([null, undefined])).toEqual({
      first: null,
      last: null,
    });
  });
});
