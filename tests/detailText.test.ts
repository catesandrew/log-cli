import { describe, expect, test } from "bun:test";
import { buildTextDetailView } from "../src/lib/detailText.ts";

describe("buildTextDetailView", () => {
  test("trims raw lines to the visible content width with an ellipsis", () => {
    const view = buildTextDetailView({
      text: "this is a very long line that should not wrap",
      width: 14,
      maxLines: 4,
    });

    expect(view.lines.map(line => line.segments.map(segment => segment.text).join(""))).toEqual([
      "this is a…",
    ]);
  });

  test("windows around the active match line for multiline raw text", () => {
    const view = buildTextDetailView({
      text: "one\ntwo\nthree\nfour\nfive\nsix",
      width: 20,
      maxLines: 3,
      focusLine: 4,
      matches: [1, 4],
    });

    expect(view.visibleStartLine).toBe(3);
    expect(view.visibleEndLine).toBe(5);
    expect(view.hiddenAbove).toBe(3);
    expect(view.lines.map(line => line.lineNumber)).toEqual([3, 4, 5]);
    expect(view.lines[1]?.isMatch).toBe(true);
    expect(view.lines[1]?.isCurrent).toBe(true);
  });

  test("trims ansi-colored text by visible width instead of escape length", () => {
    const view = buildTextDetailView({
      text: "\u001b[31merror timeout in upstream request\u001b[0m",
      width: 12,
      maxLines: 2,
    });

    expect(view.lines[0]?.segments.map(segment => segment.text).join("")).toBe("error ti…");
    expect(view.lines[0]?.segments[0]?.color).toBe("red");
  });
});
