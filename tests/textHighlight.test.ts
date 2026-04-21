import { describe, expect, test } from "bun:test";
import { buildHighlightedSegments } from "../src/lib/textHighlight.ts";

describe("buildHighlightedSegments", () => {
  test("marks matching text segments for highlighting", () => {
    const segments = buildHighlightedSegments("alpha timeout beta timeout", "timeout");
    const highlighted = segments.filter(segment => segment.highlight);
    expect(highlighted.length).toBe(2);
    expect(highlighted[0]?.text).toBe("timeout");
  });
});
