import { describe, expect, test } from "bun:test";
import { formatMergedBoundaryLabel, getMergedEntryMeta } from "../src/lib/merge.ts";
import { parseLine } from "../src/lib/parseLine.ts";

describe("merged list markers", () => {
  test("uses stable short source markers for adjacent entries", () => {
    const first = parseLine('{"timestamp":"2026-04-20T18:01:01Z","message":"one"}', {
      sourceId: "src-a",
      sourceLabel: "api.log",
      lineNumber: 1,
    });
    const second = parseLine('{"timestamp":"2026-04-20T18:01:02Z","message":"two"}', {
      sourceId: "src-a",
      sourceLabel: "api.log",
      lineNumber: 2,
    });
    const third = parseLine('{"timestamp":"2026-04-20T18:01:03Z","message":"three"}', {
      sourceId: "src-b",
      sourceLabel: "worker.log",
      lineNumber: 1,
    });

    expect(getMergedEntryMeta(first, undefined).sourceMarker).toBe("API");
    expect(getMergedEntryMeta(second, first).sourceMarker).toBe("API");
    expect(getMergedEntryMeta(third, second).sourceMarker).toBe("WOR");
    expect(getMergedEntryMeta(third, second).sourceChanged).toBe(true);
  });

  test("disambiguates markers when source labels share the same prefix", () => {
    const first = parseLine('{"timestamp":"2026-04-20T18:01:01Z","message":"one"}', {
      sourceId: "src-a",
      sourceLabel: "mixed.log",
      lineNumber: 1,
    });
    const second = parseLine('{"timestamp":"2026-04-20T18:01:02Z","message":"two"}', {
      sourceId: "src-b",
      sourceLabel: "mixed-2.log",
      lineNumber: 1,
    });

    expect(getMergedEntryMeta(first, undefined).sourceMarker).toBe("MIX");
    expect(getMergedEntryMeta(second, first).sourceMarker).toBe("MIX2");
  });

  test("formats a merged boundary label from source metadata", () => {
    const entry = parseLine('{"timestamp":"2026-04-20T18:01:01Z","message":"one"}', {
      sourceId: "src-a",
      sourceLabel: "api.log",
      lineNumber: 1,
    });

    expect(formatMergedBoundaryLabel(entry)).toBe("API: api.log");
  });
});
