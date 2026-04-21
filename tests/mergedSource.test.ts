import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";
import { createMergedSourceState } from "../src/lib/mergedSource.ts";
import type { SourceState } from "../src/types.ts";

function makeSource(id: string, label: string): SourceState {
  return {
    spec: { id, label, kind: "file", filePath: `${label}` },
    entries: [],
    droppedCount: 0,
    jsonCount: 0,
    textCount: 0,
    filter: "",
    query: "",
    levelFilter: [],
    follow: true,
    reverse: false,
    selectedIndex: 0,
    expandedPaths: ["root"],
    detailCursor: 0,
  };
}

describe("createMergedSourceState", () => {
  test("uses merged controls instead of the first source controls", () => {
    const a = makeSource("a", "a.log");
    a.entries = [
      parseLine('{"timestamp":"2026-04-20T18:01:01Z","level":"info","message":"alpha"}', {
        sourceId: "a",
        sourceLabel: "a.log",
        lineNumber: 1,
      }),
    ];
    a.filter = "message:alpha";
    a.query = 'level = "info"';
    a.follow = false;
    a.reverse = true;
    a.selectedIndex = 0;

    const b = makeSource("b", "b.log");
    b.entries = [
      parseLine('{"timestamp":"2026-04-20T18:01:02Z","level":"error","message":"beta"}', {
        sourceId: "b",
        sourceLabel: "b.log",
        lineNumber: 1,
      }),
    ];

    const merged = createMergedSourceState([a, b], {
      selectedIndex: 1,
      follow: true,
      reverse: false,
      filter: "message:beta",
      query: 'level = "error"',
      levelFilter: ["error"],
      expandedPaths: ["root", "root.a"],
      detailCursor: 3,
    });

    expect(merged.follow).toBe(true);
    expect(merged.reverse).toBe(false);
    expect(merged.filter).toBe("message:beta");
    expect(merged.query).toBe('level = "error"');
    expect(merged.levelFilter).toEqual(["error"]);
    expect(merged.expandedPaths).toEqual(["root", "root.a"]);
    expect(merged.detailCursor).toBe(3);
  });
});
