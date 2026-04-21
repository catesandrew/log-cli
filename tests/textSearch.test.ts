import { describe, expect, test } from "bun:test";
import { createTextSearch } from "../src/lib/textSearch.ts";

describe("createTextSearch", () => {
  test("finds matches across raw text lines", () => {
    const search = createTextSearch("alpha\nbeta timeout\ngamma timeout", "timeout");
    expect(search.matches.length).toBe(2);
    expect(search.next(0)).toBe(1);
    expect(search.next(1)).toBe(2);
    expect(search.prev(2)).toBe(1);
  });
});
