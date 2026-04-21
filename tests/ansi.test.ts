import { describe, expect, test } from "bun:test";
import { parseAnsiText } from "../src/lib/ansi.ts";

describe("parseAnsiText", () => {
  test("splits plain and colored segments for common sgr colors", () => {
    const segments = parseAnsiText("\u001b[31merror\u001b[0m plain");
    expect(segments[0]?.text).toBe("error");
    expect(segments[0]?.color).toBe("red");
    expect(segments[1]?.text).toBe(" plain");
  });
});
