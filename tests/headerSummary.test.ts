import { describe, expect, test } from "bun:test";
import { formatEntryCountSummary } from "../src/lib/headerSummary.ts";

describe("formatEntryCountSummary", () => {
  test("shows raw totals when nothing is filtered", () => {
    expect(
      formatEntryCountSummary({
        totalEntries: 8,
        visibleEntries: 8,
        jsonCount: 5,
        textCount: 3,
        droppedCount: 0,
      }),
    ).toContain("entries=8");
  });

  test("shows filtered counts when visible entries differ from total", () => {
    const summary = formatEntryCountSummary({
      totalEntries: 8,
      visibleEntries: 2,
      jsonCount: 5,
      textCount: 3,
      droppedCount: 0,
    });

    expect(summary).toContain("shown=2/8");
    expect(summary).toContain("json=5");
  });
});
