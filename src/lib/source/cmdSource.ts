import { spawn } from "node:child_process";
import readline from "node:readline";
import type { AppConfig, SourceSpec } from "../../types";
import { parseLine } from "../parseLine";
import type { SourceEvents, SourceHandle } from "./types";

export function startCmdSource(
  source: SourceSpec,
  events: SourceEvents,
  config: AppConfig,
): SourceHandle {
  const child = spawn("bash", ["-lc", source.command!], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  let lineNumber = 0;
  let done = false;

  const finish = (message?: string) => {
    if (done) return;
    done = true;
    if (message) {
      events.onStatus(message);
    }
    events.onSourceDone(source.id);
  };

  const readPipe = (stream: NodeJS.ReadableStream, prefix?: string) => {
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    void (async () => {
      try {
        for await (const line of rl) {
          lineNumber += 1;
          const fullLine = prefix ? `${prefix} | ${line}` : line;
          events.onEntries(source.id, [parseLine(fullLine, { sourceId: source.id, sourceLabel: source.label, lineNumber }, config)]);
        }
      } catch (error) {
        finish(`Command source read error: ${error instanceof Error ? error.message : String(error)}`);
      }
    })();
  };

  if (child.stdout) readPipe(child.stdout);
  if (child.stderr) readPipe(child.stderr, "stderr");

  child.on("close", code => {
    finish(`Command source ${source.label} exited with code ${code ?? 0}`);
  });

  child.on("error", error => {
    finish(`Command source ${source.label} error: ${error.message}`);
  });

  return {
    close() {
      child.kill("SIGTERM");
      finish();
    },
  };
}
