import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";
import { mergeEntriesByTime } from "../src/lib/merge.ts";

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
});
