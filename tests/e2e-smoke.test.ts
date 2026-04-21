import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = import.meta.dir.endsWith("/tests")
  ? join(import.meta.dir, "..")
  : import.meta.dir;

function run(args: string[], input?: string): string {
  const result = spawnSync("bun", args, {
    cwd: root,
    encoding: "utf8",
    input,
  });
  expect(result.status).toBe(0);
  return `${result.stdout}${result.stderr}`;
}

describe("log e2e smoke", () => {
  test("shows top-level help", () => {
    const output = run(["run", "src/cli.ts", "--help"]);
    expect(output).toContain("log");
    expect(output).toContain("--url");
    expect(output).toContain("--cmd");
  });

  test("summarizes a file as json", () => {
    const output = run(["run", "src/cli.ts", "examples/mixed.log", "--summary-json"]);
    expect(output).toContain("\"sources\"");
    expect(output).toContain("\"totalEntries\"");
  });

  test("summarizes piped stdin as text", () => {
    const output = run(["run", "src/cli.ts", "--summary-text"], '{"level":"info","message":"hello"}\n');
    expect(output).toContain("entries=");
    expect(output).toContain("json=");
  });
});
