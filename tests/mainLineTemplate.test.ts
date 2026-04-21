import { describe, expect, test } from "bun:test";
import { renderMainLine } from "../src/lib/mainLineTemplate.ts";
import { parseLine } from "../src/lib/parseLine.ts";

describe("main line template", () => {
  test("renders Handlebars variables and placeholder-substituted message", () => {
    const entry = parseLine(
      '{"timestamp":"2026-04-20T18:01:00Z","level":30,"message":"User #{user} logged in","extra_data":{"user":"alice"}}',
      { sourceId: "s1", lineNumber: 1 },
      {
        levelMap: { "30": "info" },
        placeholderFormat: "#{key}",
        contextPath: "extra_data",
      },
    );

    const output = renderMainLine(entry, {
      maxEntries: 50000,
      batchMs: 50,
      columns: [],
      preserveAnsiText: true,
      levelMap: { "30": "info" },
      mainLineTemplate: '{{uppercase level}} {{message}} {{fixed_size prefix 4}}',
    });

    expect(entry.levelNormalized).toBe("info");
    expect(output).toContain("INFO");
    expect(output).toContain("User alice logged in");
  });
});
