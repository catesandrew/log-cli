import { describe, expect, test } from "bun:test";
import { formatMergedSourceSummary } from "../src/lib/merge.ts";

describe("formatMergedSourceSummary", () => {
  test("summarizes merged sources compactly", () => {
    expect(formatMergedSourceSummary(["mixed.log", "mixed-2.log"], 80)).toBe(
      "merged(2): mixed.log, mixed-2.log",
    );
  });

  test("trims long summaries to fit the header width", () => {
    const summary = formatMergedSourceSummary(
      ["very-long-api.log", "very-long-worker.log", "very-long-db.log"],
      32,
    );
    expect(summary.length).toBeLessThanOrEqual(32);
    expect(summary.startsWith("merged(3):")).toBe(true);
  });

  test("annotates merged summary when merged filter or query is active", () => {
    const summary = formatMergedSourceSummary(["mixed.log", "mixed-2.log"], 80, {
      filterActive: true,
      queryActive: true,
    });
    expect(summary).toContain("filter");
    expect(summary).toContain("query");
  });

  test("annotates merged summary when reverse or nofollow are active", () => {
    const summary = formatMergedSourceSummary(["mixed.log", "mixed-2.log"], 80, {
      reverseActive: true,
      followActive: false,
    });
    expect(summary).toContain("reverse");
    expect(summary).toContain("nofollow");
  });
});
