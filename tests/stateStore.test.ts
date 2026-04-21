import { describe, expect, test } from "bun:test";
import { buildStartupStatusLine, getDefaultAppState } from "../src/state/AppStateStore.ts";

describe("getDefaultAppState", () => {
  test("starts in merged view when requested", () => {
    const state = getDefaultAppState(
      [
        { id: "a", label: "a.log", kind: "file", filePath: "a.log" },
        { id: "b", label: "b.log", kind: "file", filePath: "b.log" },
      ],
      {
        maxEntries: 50000,
        batchMs: 50,
        columns: [],
        preserveAnsiText: true,
      },
      { mergedView: true },
    );

    expect(state.mergedView).toBe(true);
    expect(state.mergeIgnored).toBe(false);
    expect(state.statusLine).toContain("merged");
    expect(state.mergedFollow).toBe(true);
    expect(state.mergedReverse).toBe(false);
    expect(state.mergedSelectedIndex).toBe(0);
    expect(state.mergedFilter).toBe("");
    expect(state.mergedQuery).toBe("");
    expect(state.mergedExpandedPaths).toEqual(["root"]);
    expect(state.mergedDetailCursor).toBe(0);
  });

  test("merged filter and query are independent from source-local controls", () => {
    const state = getDefaultAppState(
      [
        { id: "a", label: "a.log", kind: "file", filePath: "a.log" },
        { id: "b", label: "b.log", kind: "file", filePath: "b.log" },
      ],
      {
        maxEntries: 50000,
        batchMs: 50,
        columns: [],
        preserveAnsiText: true,
      },
      { mergedView: true },
    );

    expect(state.sources[0]?.filter).toBe("");
    expect(state.sources[0]?.query).toBe("");
    expect(state.mergedFilter).toBe("");
    expect(state.mergedQuery).toBe("");
  });

  test("can seed default filter and query at startup", () => {
    const state = getDefaultAppState(
      [
        { id: "a", label: "a.log", kind: "file", filePath: "a.log" },
        { id: "b", label: "b.log", kind: "file", filePath: "b.log" },
      ],
      {
        maxEntries: 50000,
        batchMs: 50,
        columns: [],
        preserveAnsiText: true,
      },
      { mergedView: true, defaultFilter: "message:error", defaultQuery: 'level = "error"' },
    );

    expect(state.mergedFilter).toBe("message:error");
    expect(state.mergedQuery).toBe('level = "error"');
    expect(state.sources[0]?.filter).toBe("message:error");
    expect(state.sources[0]?.query).toBe('level = "error"');
    expect(state.statusLine).toContain("merged");
    expect(state.statusLine).toContain("filter");
    expect(state.statusLine).toContain("query");
  });

  test("can seed reverse and follow controls at startup", () => {
    const state = getDefaultAppState(
      [
        { id: "a", label: "a.log", kind: "file", filePath: "a.log" },
        { id: "b", label: "b.log", kind: "file", filePath: "b.log" },
      ],
      {
        maxEntries: 50000,
        batchMs: 50,
        columns: [],
        preserveAnsiText: true,
      },
      { mergedView: true, follow: false, reverse: true },
    );

    expect(state.mergedFollow).toBe(false);
    expect(state.mergedReverse).toBe(true);
    expect(state.sources[0]?.follow).toBe(false);
    expect(state.sources[0]?.reverse).toBe(true);
  });

  test("builds a startup status line that includes active startup controls", () => {
    expect(
      buildStartupStatusLine(2, {
        mergedView: true,
        defaultFilter: "message:error",
        defaultQuery: 'level = "error"',
        reverse: true,
        follow: false,
      }),
    ).toBe("Loaded 2 source(s) in merged view with filter + query + reverse + nofollow.");
  });

  test("explains when merge was requested but only one source exists", () => {
    const state = getDefaultAppState(
      [{ id: "a", label: "a.log", kind: "file", filePath: "a.log" }],
      {
        maxEntries: 50000,
        batchMs: 50,
        columns: [],
        preserveAnsiText: true,
      },
      { mergedView: true },
    );

    expect(state.mergeIgnored).toBe(true);
    expect(
      buildStartupStatusLine(1, {
        mergedView: true,
      }),
    ).toBe("Loaded 1 source(s). Merge ignored without multiple sources.");
  });
});
