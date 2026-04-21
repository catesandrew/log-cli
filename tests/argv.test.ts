import { describe, expect, test } from "bun:test";
import { moveTrailingOptionsBeforePositionals, parseTopLevelArgs } from "../src/lib/argv.ts";

describe("moveTrailingOptionsBeforePositionals", () => {
  test("moves known trailing flags ahead of variadic file args", () => {
    expect(
      moveTrailingOptionsBeforePositionals([
        "examples/mixed.log",
        "--merge",
        "--reverse",
        "--filter",
        "message:error",
      ]),
    ).toEqual([
      "--merge",
      "--reverse",
      "--filter",
      "message:error",
      "examples/mixed.log",
    ]);
  });

  test("keeps pure positional args stable", () => {
    expect(moveTrailingOptionsBeforePositionals(["a.log", "b.log"])).toEqual([
      "a.log",
      "b.log",
    ]);
  });

  test("parses top-level options after file args", () => {
    const parsed = parseTopLevelArgs([
      "examples/mixed.log",
      "--merge",
      "--reverse",
      "--filter",
      "message:error",
    ]);

    expect(parsed.files).toEqual(["examples/mixed.log"]);
    expect(parsed.options.merge).toBe(true);
    expect(parsed.options.reverse).toBe(true);
    expect(parsed.options.filter).toBe("message:error");
  });
});
