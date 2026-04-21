import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";
import { deriveMergedSelectionIndex, getMergedEntryMeta, mergeEntriesByTime } from "../src/lib/merge.ts";

describe("mergeEntriesByTime", () => {
  test("merges multiple sources in ascending timestamp order", () => {
    const one = parseLine('{"timestamp":"2026-04-20T18:01:02Z","message":"two"}', {
      sourceId: "a",
      lineNumber: 1,
    });
    const two = parseLine('{"timestamp":"2026-04-20T18:01:01Z","message":"one"}', {
      sourceId: "b",
      lineNumber: 1,
    });
    const merged = mergeEntriesByTime([[one], [two]], false);
    expect(merged.map(item => item.message)).toEqual(["one", "two"]);
  });

  test("reverses merged ordering when requested", () => {
    const one = parseLine('{"timestamp":"2026-04-20T18:01:02Z","message":"two"}', {
      sourceId: "a",
      lineNumber: 1,
    });
    const two = parseLine('{"timestamp":"2026-04-20T18:01:01Z","message":"one"}', {
      sourceId: "b",
      lineNumber: 1,
    });
    const merged = mergeEntriesByTime([[one], [two]], true);
    expect(merged.map(item => item.message)).toEqual(["two", "one"]);
  });

  test("derives merged source markers and source-change boundaries", () => {
    const first = parseLine('{"timestamp":"2026-04-20T18:01:01Z","message":"one"}', {
      sourceId: "a",
      sourceLabel: "api.log",
      lineNumber: 1,
    });
    const second = parseLine('{"timestamp":"2026-04-20T18:01:02Z","message":"two"}', {
      sourceId: "a",
      sourceLabel: "api.log",
      lineNumber: 2,
    });
    const third = parseLine('{"timestamp":"2026-04-20T18:01:03Z","message":"three"}', {
      sourceId: "b",
      sourceLabel: "worker.log",
      lineNumber: 1,
    });

    expect(getMergedEntryMeta(first, undefined)).toEqual({
      sourceMarker: "API",
      sourceChanged: true,
    });
    expect(getMergedEntryMeta(second, first)).toEqual({
      sourceMarker: "API",
      sourceChanged: false,
    });
    expect(getMergedEntryMeta(third, second)).toEqual({
      sourceMarker: "WOR",
      sourceChanged: true,
    });
  });

  test("pins merged selection to the bottom while following", () => {
    expect(deriveMergedSelectionIndex(0, 5, true)).toBe(4);
  });

  test("preserves merged selection when follow is off", () => {
    expect(deriveMergedSelectionIndex(2, 5, false)).toBe(2);
    expect(deriveMergedSelectionIndex(9, 5, false)).toBe(4);
  });
});
