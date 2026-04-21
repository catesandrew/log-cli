import { describe, expect, test } from "bun:test";
import { evaluateFilterExpression, parseFilterExpression, buildFilter } from "../src/lib/filter.ts";
import { parseLine } from "../src/lib/parseLine.ts";

function jsonEntry(line: string) {
  return parseLine(line, { sourceId: "s1", lineNumber: 1 });
}

describe("advanced filter language", () => {
  test("parses equality, numeric comparison, and boolean groups", () => {
    const expr = parseFilterExpression(
      '(request.method = "GET" and duration_ms >= 100) or level != "info"',
    );
    const entry = jsonEntry(
      '{"request":{"method":"GET"},"duration_ms":125,"level":"info","message":"ok"}',
    );
    expect(evaluateFilterExpression(expr, entry)).toBe(true);
  });

  test("supports substring, wildcard like, and regex matching", () => {
    const entry = jsonEntry(
      '{"message":"database timeout while reconnecting","service":"db-primary"}',
    );
    expect(buildFilter('message ~= "timeout"')(entry)).toBe(true);
    expect(buildFilter('service like "db*"')(entry)).toBe(true);
    expect(buildFilter('message ~~= "reconnect.*"')(entry)).toBe(true);
    expect(buildFilter('message !~= "health"')(entry)).toBe(true);
  });

  test("supports nested paths, wildcards, and array indexes", () => {
    const entry = jsonEntry(
      '{"span":[{"name":"db.query"},{"name":"cache.hit"}],"request":{"method":"POST"}}',
    );
    expect(buildFilter('span.[].name = "db.query"')(entry)).toBe(true);
    expect(buildFilter('span.[1].name = "cache.hit"')(entry)).toBe(true);
    expect(buildFilter('request.method = "POST"')(entry)).toBe(true);
  });

  test("supports exists and optional paths", () => {
    const entry = jsonEntry('{"user":{"id":"u-1"},"message":"ok"}');
    expect(buildFilter("exists(.user.id)")(entry)).toBe(true);
    expect(buildFilter(".trace_id? = anything")(entry)).toBe(true);
    expect(buildFilter("not exists(.trace_id)")(entry)).toBe(true);
  });

  test("supports set membership and negated set membership", () => {
    const entry = jsonEntry('{"level":"warn","service":"api"}');
    expect(buildFilter('level in ("warn","error")')(entry)).toBe(true);
    expect(buildFilter('service not in ("db","cache")')(entry)).toBe(true);
  });

  test("applies message substring filters to text entries", () => {
    const entry = parseLine("plain text timeout from worker", {
      sourceId: "s1",
      lineNumber: 1,
    });
    expect(buildFilter('message ~= "timeout"')(entry)).toBe(true);
    expect(buildFilter('message = "plain text timeout from worker"')(entry)).toBe(true);
  });

  test("keeps legacy field:value shorthand working", () => {
    const entry = jsonEntry('{"level":"error","message":"database timeout"}');
    expect(buildFilter("level:error")(entry)).toBe(true);
    expect(buildFilter("timeout")(entry)).toBe(true);
  });
});
