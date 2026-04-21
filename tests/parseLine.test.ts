import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";

describe("parseLine", () => {
  test("parses plain JSON lines", () => {
    const entry = parseLine('{"timestamp":"2026-04-20T18:01:00Z","level":"info","message":"booted"}', {
      sourceId: "s1",
      lineNumber: 1,
    });

    expect(entry.kind).toBe("json");
    expect(entry.levelNormalized).toBe("info");
    expect(entry.message).toBe("booted");
    expect(entry.prefix).toBeUndefined();
  });

  test("parses prefixed JSON lines", () => {
    const entry = parseLine('api-1 | {"time":"2026-04-20T18:01:02Z","severity":"warn","msg":"slow request"}', {
      sourceId: "s1",
      lineNumber: 2,
    });

    expect(entry.kind).toBe("json");
    expect(entry.prefix).toBe("api-1");
    expect(entry.levelNormalized).toBe("warn");
    expect(entry.message).toBe("slow request");
  });

  test("keeps non-json as plain text", () => {
    const entry = parseLine("plain text line", {
      sourceId: "s1",
      lineNumber: 3,
    });

    expect(entry.kind).toBe("text");
    expect(entry.raw).toBe("plain text line");
    expect(entry.message).toContain("plain text line");
  });
});
