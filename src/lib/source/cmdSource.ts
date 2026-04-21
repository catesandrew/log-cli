import { spawn } from "node:child_process";
import readline from "node:readline";
import type { SourceSpec } from "../../types";
import { parseLine } from "../parseLine";
import type { SourceEvents, SourceHandle } from "./types";

export function startCmdSource(source: SourceSpec, events: SourceEvents): SourceHandle {
  const child = spawn("bash", ["-lc", source.command!], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let lineNumber = 0;

  const readPipe = (stream: NodeJS.ReadableStream, prefix?: string) => {
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    void (async () => {
      for await (const line of rl) {
        lineNumber += 1;
        const fullLine = prefix ? `${prefix} | ${line}` : line;
        events.onEntries(source.id, [parseLine(fullLine, { sourceId: source.id, sourceLabel: source.label, lineNumber })]);
      }
    })();
  };

  if (child.stdout) readPipe(child.stdout);
  if (child.stderr) readPipe(child.stderr, "stderr");

  child.on("close", code => {
    events.onStatus(`Command source ${source.label} exited with code ${code ?? 0}`);
  });

  return {
    close() {
      child.kill("SIGTERM");
    },
  };
}
