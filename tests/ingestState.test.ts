import { describe, expect, test } from "bun:test";
import { applyEntryBatch } from "../src/lib/ingestState.ts";
import { parseLine } from "../src/lib/parseLine.ts";
import type { SourceState } from "../src/types.ts";

function sourceState(): SourceState {
  return {
    spec: { id: "s1", label: "source", kind: "file", filePath: "x.log" },
    entries: [],
    droppedCount: 0,
    jsonCount: 0,
    textCount: 0,
    filter: "",
    query: "",
    follow: true,
    reverse: false,
    selectedIndex: 0,
    expandedPaths: ["root"],
    detailCursor: 0,
  };
}

describe("applyEntryBatch", () => {
  test("appends entries and keeps follow pinned to the bottom", () => {
    const first = parseLine('{"message":"one"}', { sourceId: "s1", lineNumber: 1 });
    const second = parseLine('{"message":"two"}', { sourceId: "s1", lineNumber: 2 });
    const next = applyEntryBatch(sourceState(), [first, second], 50000);
    expect(next.entries.length).toBe(2);
    expect(next.selectedIndex).toBe(1);
    expect(next.jsonCount).toBe(2);
  });

  test("drops old entries when max size is exceeded", () => {
    const state = sourceState();
    const entries = [
      parseLine('{"message":"one"}', { sourceId: "s1", lineNumber: 1 }),
      parseLine('{"message":"two"}', { sourceId: "s1", lineNumber: 2 }),
      parseLine('{"message":"three"}', { sourceId: "s1", lineNumber: 3 }),
    ];
    const next = applyEntryBatch(state, entries, 2);
    expect(next.entries.map(entry => entry.message)).toEqual(["two", "three"]);
    expect(next.droppedCount).toBe(1);
  });

  test("keeps manual selection stable when follow is disabled", () => {
    const state = sourceState();
    state.follow = false;
    state.selectedIndex = 0;
    const one = parseLine('{"message":"one"}', { sourceId: "s1", lineNumber: 1 });
    const two = parseLine('{"message":"two"}', { sourceId: "s1", lineNumber: 2 });
    const next = applyEntryBatch(state, [one, two], 50000);
    expect(next.selectedIndex).toBe(0);
  });
});
