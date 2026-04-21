import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import http from "node:http";
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

function runDirect(cmd: string, args: string[]): string {
  const result = spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
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

  test("summarizes multiple files as multiple sources", () => {
    const output = run([
      "run",
      "src/cli.ts",
      "examples/mixed.log",
      "examples/mixed-2.log",
      "--summary-json",
    ]);
    expect(output).toContain("\"label\": \"mixed.log\"");
    expect(output).toContain("\"label\": \"mixed-2.log\"");
    expect(output).toContain("\"totalEntries\": 8");
  });

  test("help documents merged startup mode", () => {
    const output = run(["run", "src/cli.ts", "--help"]);
    expect(output).toContain("--merge");
    expect(output).toContain("ignored with one source");
    expect(output).toContain("--filter");
    expect(output).toContain("--query");
    expect(output).toContain("--reverse");
    expect(output).toContain("--no-follow");
  });

  test("help documents merged startup filters and queries together", () => {
    const output = run(["run", "src/cli.ts", "--help"]);
    expect(output).toContain("--merge");
    expect(output).toContain("--filter");
    expect(output).toContain("--query");
    expect(output).toContain("--reverse");
    expect(output).toContain("--no-follow");
  });

  test("applies startup filter and query in summary mode", () => {
    const output = run([
      "run",
      "src/cli.ts",
      "examples/mixed.log",
      "--summary-json",
      "--filter",
      "message:timeout",
      "--query",
      'level = "error"',
    ]);
    expect(output).toContain("\"totalEntries\": 1");
  });

  test("applies startup filter and query in merged summary mode with matching results", () => {
    const output = run([
      "run",
      "src/cli.ts",
      "examples/mixed.log",
      "examples/mixed-2.log",
      "--merge",
      "--summary-json",
      "--filter",
      "message:line",
      "--query",
      'level = "unknown"',
    ]);
    expect(output).toContain('"label": "mixed.log"');
    expect(output).toContain('"label": "mixed-2.log"');
    expect(output).toContain('"totalEntries": 2');
  });

  test("supports the full merged startup control set together", () => {
    const output = run([
      "run",
      "src/cli.ts",
      "examples/mixed.log",
      "examples/mixed-2.log",
      "--merge",
      "--reverse",
      "--no-follow",
      "--summary-json",
      "--filter",
      "message:line",
      "--query",
      'level = "unknown"',
    ]);
    expect(output).toContain('"label": "mixed.log"');
    expect(output).toContain('"label": "mixed-2.log"');
    expect(output).toContain('"totalEntries": 2');
    expect(output).toContain('"metadata"');
    expect(output).toContain('"mergedActive": true');
    expect(output).toContain('"reverse": true');
    expect(output).toContain('"follow": false');
  });

  test("summarizes piped stdin as text", () => {
    const output = run(["run", "src/cli.ts", "--summary-text"], '{"level":"info","message":"hello"}\n');
    expect(output).toContain("entries=");
    expect(output).toContain("json=");
  });

  test("summarizes command output", () => {
    const output = run([
      "dist/cli.js",
      "--cmd",
      "printf '{\"level\":\"info\",\"message\":\"from-cmd\"}\\nplain line\\n'",
      "--summary-json",
    ]);
    expect(output).toContain("\"entries\": 2");
    expect(output).toContain("\"json\": 1");
    expect(output).toContain("\"text\": 1");
  });

  test("summarizes a streaming URL", async () => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      res.write('{"level":"info","message":"from-url"}\n');
      res.end("plain text\n");
    });

    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("failed to start test server");
    }

    try {
      const output = run([
        "dist/cli.js",
        "--url",
        `http://127.0.0.1:${address.port}`,
        "--summary-json",
      ]);
      expect(output).toContain("\"entries\": 2");
      expect(output).toContain("\"json\": 1");
      expect(output).toContain("\"text\": 1");
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      );
    }
  });

  test("handles a high-volume synthetic command stream", () => {
    const output = run([
      "dist/cli.js",
      "--cmd",
      "node ./examples/high-volume-generator.mjs",
      "--summary-json",
    ]);
    expect(output).toContain("\"entries\": 2000");
    expect(output).toContain("\"json\": 2000");
  });

  test("wrapper binary supports merged startup filters and queries", () => {
    const output = runDirect("./bin/log", [
      "examples/mixed.log",
      "examples/mixed-2.log",
      "--merge",
      "--reverse",
      "--no-follow",
      "--filter",
      "message:line",
      "--query",
      'level = "unknown"',
      "--summary-json",
    ]);
    expect(output).toContain('"label": "mixed.log"');
    expect(output).toContain('"label": "mixed-2.log"');
    expect(output).toContain('"totalEntries": 2');
    expect(output).toContain('"follow": false');
  });

  test("wrapper binary ignores merge when only one source is provided", () => {
    const output = runDirect("./bin/log", [
      "examples/mixed.log",
      "--merge",
      "--summary-text",
    ]);
    expect(output).toContain("entries=5");
    expect(output).toContain("json=3");
    expect(output).toContain("text=2");
  });
});
