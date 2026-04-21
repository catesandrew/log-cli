import readline from "node:readline";
import type { AppConfig, SourceSpec } from "../../types";
import { parseLine } from "../parseLine";
import type { SourceEvents, SourceHandle } from "./types";

export function startStdinSource(
  source: SourceSpec,
  events: SourceEvents,
  config: AppConfig,
): SourceHandle {
  process.stdin.setEncoding("utf8");
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
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

  void (async () => {
    try {
      for await (const line of rl) {
        lineNumber += 1;
        events.onEntries(source.id, [parseLine(line, { sourceId: source.id, sourceLabel: source.label, lineNumber }, config)]);
      }
      finish("stdin stream completed");
    } catch (error) {
      finish(`stdin stream error: ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  return {
    close() {
      rl.close();
      finish();
    },
  };
}
