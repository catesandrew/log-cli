import { describe, expect, test } from "bun:test";
import { computePaneWidths, fitInlineParts } from "../src/lib/layout.ts";

describe("layout helpers", () => {
  test("computes balanced pane widths for narrow terminals", () => {
    const layout = computePaneWidths(90);
    expect(layout.listWidth).toBeGreaterThanOrEqual(40);
    expect(layout.detailWidth).toBeGreaterThanOrEqual(24);
    expect(layout.listWidth + layout.detailWidth + layout.gap).toBeLessThanOrEqual(90);
  });

  test("truncates inline parts to avoid footer smashing", () => {
    const line = fitInlineParts(
      ["focus:list", "follow:on", "reverse:off", "merged:off", "query:on", "search:on", "fps:60"],
      40,
    );
    expect(line.length).toBeLessThanOrEqual(40);
    expect(line).toContain("focus:list");
  });
});
