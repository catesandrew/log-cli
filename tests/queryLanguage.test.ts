import { describe, expect, test } from "bun:test";
import { parseLine } from "../src/lib/parseLine.ts";
import { buildQuery } from "../src/lib/query.ts";

function entry(line: string) {
  return parseLine(line, { sourceId: "s1", lineNumber: 1 });
}

describe("query language", () => {
  test("supports boolean and field comparisons", () => {
    const matcher = buildQuery('level = "error" and service like "db"');
    expect(
      matcher(entry('{"level":"error","service":"db-primary","message":"timeout"}')),
    ).toBe(true);
    expect(
      matcher(entry('{"level":"info","service":"db-primary","message":"timeout"}')),
    ).toBe(false);
  });

  test("supports exists and in", () => {
    const matcher = buildQuery('exists(user.id) and level in ("warn","error")');
    expect(
      matcher(entry('{"level":"warn","user":{"id":"u-1"},"message":"slow"}')),
    ).toBe(true);
    expect(
      matcher(entry('{"level":"warn","message":"slow"}')),
    ).toBe(false);
  });

  test("supports not and regex", () => {
    const matcher = buildQuery('not message =~ "health"');
    expect(matcher(entry('{"message":"request failed"}'))).toBe(true);
    expect(matcher(entry('{"message":"health check ok"}'))).toBe(false);
  });
});
