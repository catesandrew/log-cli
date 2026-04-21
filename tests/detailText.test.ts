import { describe, expect, test } from "bun:test";
import { buildTextDetailLines } from "../src/lib/detailText.ts";

describe("buildTextDetailLines", () => {
  test("truncates long lines to pane width", () => {
    const lines = buildTextDetailLines(
      "this is a very long line that should not wrap",
      12,
    );
    expect(lines).toEqual(["this is a v…"]);
  });

  test("limits total rendered lines when requested", () => {
    const lines = buildTextDetailLines("one\ntwo\nthree\nfour", 20, 3);
    expect(lines).toEqual(["one", "two", "three…"]);
  });
});
