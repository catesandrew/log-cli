import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";
import { sliceListWindow } from "../src/lib/listWindow.ts";

function makeEntry(sourceId: string, sourceLabel: string, lineNumber: number, timestamp: string) {
  return parseLine(
    JSON.stringify({
      timestamp,
      message: `${sourceLabel}-${lineNumber}`,
    }),
    {
      sourceId,
      sourceLabel,
      lineNumber,
    },
  );
}

describe("sliceListWindow", () => {
  test("uses a centered entry window in normal mode", () => {
    const entries = [
      makeEntry("a", "api.log", 1, "2026-04-20T18:01:01Z"),
      makeEntry("a", "api.log", 2, "2026-04-20T18:01:02Z"),
      makeEntry("a", "api.log", 3, "2026-04-20T18:01:03Z"),
      makeEntry("a", "api.log", 4, "2026-04-20T18:01:04Z"),
      makeEntry("a", "api.log", 5, "2026-04-20T18:01:05Z"),
    ];

    const window = sliceListWindow({
      entries,
      selectedIndex: 3,
      maxRows: 3,
      mergedView: false,
    });

    expect(window.startIndex).toBe(2);
    expect(window.window.map(entry => entry.lineNumber)).toEqual([3, 4, 5]);
  });

  test("caps merged windows by rendered rows including source boundaries", () => {
    const entries = [
      makeEntry("a", "api.log", 1, "2026-04-20T18:01:01Z"),
      makeEntry("b", "worker.log", 1, "2026-04-20T18:01:02Z"),
      makeEntry("a", "api.log", 2, "2026-04-20T18:01:03Z"),
      makeEntry("b", "worker.log", 2, "2026-04-20T18:01:04Z"),
    ];

    const window = sliceListWindow({
      entries,
      selectedIndex: 1,
      maxRows: 4,
      mergedView: true,
    });

    expect(window.startIndex).toBe(0);
    expect(window.window.map(entry => `${entry.sourceId}:${entry.lineNumber}`)).toEqual([
      "a:1",
      "b:1",
    ]);
  });

  test("keeps the selected entry visible when a merged window would otherwise overflow", () => {
    const entries = [
      makeEntry("a", "api.log", 1, "2026-04-20T18:01:01Z"),
      makeEntry("b", "worker.log", 1, "2026-04-20T18:01:02Z"),
      makeEntry("a", "api.log", 2, "2026-04-20T18:01:03Z"),
      makeEntry("b", "worker.log", 2, "2026-04-20T18:01:04Z"),
      makeEntry("a", "api.log", 3, "2026-04-20T18:01:05Z"),
    ];

    const window = sliceListWindow({
      entries,
      selectedIndex: 4,
      maxRows: 4,
      mergedView: true,
    });

    expect(window.startIndex).toBe(4);
    expect(window.window.map(entry => `${entry.sourceId}:${entry.lineNumber}`)).toEqual([
      "a:3",
    ]);
  });
});
