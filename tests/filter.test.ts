import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";
import { buildFilter } from "../src/lib/filter.ts";

describe("filter", () => {
  test("matches substring text", () => {
    const entry = parseLine('{"level":"info","message":"server booted"}', {
      sourceId: "s1",
      lineNumber: 1,
    });
    expect(buildFilter("boot")(entry)).toBe(true);
    expect(buildFilter("missing")(entry)).toBe(false);
  });

  test("matches field:value queries", () => {
    const entry = parseLine('{"level":"error","message":"database timeout"}', {
      sourceId: "s1",
      lineNumber: 1,
    });
    expect(buildFilter("level:error")(entry)).toBe(true);
    expect(buildFilter("level:info")(entry)).toBe(false);
  });
});
