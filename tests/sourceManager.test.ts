import { describe, expect, test } from "bun:test";
import { createSourceManagerHarness } from "../src/lib/sourceManager.ts";
import { parseLine } from "../src/lib/parseLine.ts";

describe("source manager batching", () => {
  test("coalesces multiple entries into one flush", () => {
    const batches: number[] = [];
    const harness = createSourceManagerHarness(
      [{ id: "s1", label: "test", kind: "stdin" }],
      { maxEntries: 50000, batchMs: 50, columns: [], preserveAnsiText: true, levelMap: {} },
      {
        onBatch(_sourceId, entries) {
          batches.push(entries.length);
        },
        onStatus() {},
      },
    );

    harness.onEntries("s1", [
      parseLine('{"message":"one"}', { sourceId: "s1", lineNumber: 1 }),
      parseLine('{"message":"two"}', { sourceId: "s1", lineNumber: 2 }),
    ]);
    harness.flush();

    expect(batches).toEqual([2]);
  });

  test("emits only new entries on later flushes instead of replaying the full buffer", () => {
    const batches: string[][] = [];
    const harness = createSourceManagerHarness(
      [{ id: "s1", label: "test", kind: "stdin" }],
      { maxEntries: 50000, batchMs: 50, columns: [], preserveAnsiText: true, levelMap: {} },
      {
        onBatch(_sourceId, entries) {
          batches.push(entries.map(entry => entry.message));
        },
        onStatus() {},
      },
    );

    harness.onEntries("s1", [
      parseLine('{"message":"one"}', { sourceId: "s1", lineNumber: 1 }),
      parseLine('{"message":"two"}', { sourceId: "s1", lineNumber: 2 }),
    ]);
    harness.flush();

    harness.onEntries("s1", [
      parseLine('{"message":"three"}', { sourceId: "s1", lineNumber: 3 }),
    ]);
    harness.flush();

    expect(batches).toEqual([["one", "two"], ["three"]]);
  });
});
