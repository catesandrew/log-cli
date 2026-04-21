import { describe, expect, test } from "bun:test";
import {
  abbreviateStateValue,
  computePaneWidths,
  fitInlineParts,
  trimLineForPane,
} from "../src/lib/layout.ts";

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

  test("trims long pane lines without wrapping", () => {
    const line = trimLineForPane("this is a very long detail header line", 12);
    expect(line.length).toBeLessThanOrEqual(12);
    expect(line.endsWith("…")).toBe(true);
  });

  test("abbreviates state values for compact footer display", () => {
    expect(abbreviateStateValue("mflt", "message:timeout", 16)).toBe("mflt:message:ti…");
    expect(abbreviateStateValue("mqry", 'level = "error"', 18)).toBe('mqry:level = "err…');
  });
});
