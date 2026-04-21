import { describe, expect, test } from "bun:test";
import {
  applySuggestionToQuery,
  buildInlineCompletion,
  buildQuerySuggestions,
  extractActiveQueryFragment,
} from "../src/lib/queryAutocomplete.ts";
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

  test("ranks prefix matches ahead of weaker matches", () => {
    const suggestions = buildQuerySuggestions(entries, "lev");
    expect(suggestions[0]).toContain("level");
  });

  test("suggests operators and snippets for empty query", () => {
    const suggestions = buildQuerySuggestions(entries, "");
    expect(suggestions).toContain('level = "error"');
    expect(suggestions).toContain("exists(user.id)");
  });

  test("builds an inline completion suffix from the active suggestion", () => {
    expect(buildInlineCompletion('lev', 'level = "error"')).toBe('el = "error"');
    expect(buildInlineCompletion('message', 'level = "error"')).toBe("");
  });

  test("extracts the active query fragment at the end of the draft", () => {
    expect(extractActiveQueryFragment('level = "error" and ser')).toBe("ser");
    expect(extractActiveQueryFragment("")).toBe("");
  });

  test("applies a suggestion to only the active fragment", () => {
    expect(applySuggestionToQuery('level = "error" and ser', 'service = ""')).toBe(
      'level = "error" and service = ""',
    );
  });
});
