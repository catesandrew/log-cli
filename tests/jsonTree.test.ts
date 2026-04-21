import { describe, expect, test } from "bun:test";
import { flattenJsonTree } from "../src/lib/jsonTree.ts";

describe("flattenJsonTree", () => {
  test("flattens nested objects using expansion state", () => {
    const rows = flattenJsonTree({ a: { b: 1 }, c: true }, new Set(["root", "root.a"]));
    expect(rows.map(row => row.path)).toEqual(["root", "root.a", "root.a.b", "root.c"]);
  });
});
