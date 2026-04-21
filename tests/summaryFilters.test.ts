import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";
import { buildFilteredSummary } from "../src/lib/summary.ts";

describe("buildFilteredSummary", () => {
  test("applies filter and query before summarizing", () => {
    const entriesBySource = new Map([
      ["src-1", [
        parseLine('{"level":"info","message":"ok"}', { sourceId: "src-1", lineNumber: 1 }),
        parseLine('{"level":"error","message":"boom"}', { sourceId: "src-1", lineNumber: 2 }),
      ]],
    ]);

    const summary = buildFilteredSummary(
      [{ id: "src-1", label: "a.log", kind: "file", filePath: "a.log" }],
      entriesBySource,
      "message:boom",
      'level = "error"',
    );

    expect(summary.totalEntries).toBe(1);
    expect(summary.sources[0]?.json).toBe(1);
  });

  test("can include startup metadata in the summary output", () => {
    const entriesBySource = new Map([
      ["src-1", [
        parseLine('{"level":"error","message":"boom"}', { sourceId: "src-1", lineNumber: 1 }),
      ]],
    ]);

    const summary = buildFilteredSummary(
      [{ id: "src-1", label: "a.log", kind: "file", filePath: "a.log" }],
      entriesBySource,
      "message:boom",
      'level = "error"',
      {
        mergedRequested: false,
        mergedActive: false,
        reverse: false,
        follow: true,
        filter: "message:boom",
        query: 'level = "error"',
      },
    );

    expect(summary.metadata?.filter).toBe("message:boom");
    expect(summary.metadata?.query).toBe('level = "error"');
  });
});
