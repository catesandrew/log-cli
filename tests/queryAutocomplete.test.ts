import { describe, expect, test } from "bun:test";
import { buildQuerySuggestions } from "../src/lib/queryAutocomplete.ts";
import { parseLine } from "../src/lib/parseLine.ts";

describe("buildQuerySuggestions", () => {
  const entries = [
    parseLine('{"level":"error","service":"db","user":{"id":"u-1"},"message":"timeout"}', {
      sourceId: "s1",
      lineNumber: 1,
    }),
    parseLine('{"level":"info","service":"api","message":"ok"}', {
      sourceId: "s1",
      lineNumber: 2,
    }),
  ];

  test("suggests fields from observed entries", () => {
    const suggestions = buildQuerySuggestions(entries, "ser");
    expect(suggestions.some(item => item.includes("service"))).toBe(true);
  });

  test("suggests operators and snippets for empty query", () => {
    const suggestions = buildQuerySuggestions(entries, "");
    expect(suggestions).toContain('level = "error"');
    expect(suggestions).toContain("exists(user.id)");
  });
});
