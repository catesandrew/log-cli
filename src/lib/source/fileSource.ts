import fs from "node:fs";
import readline from "node:readline";
import type { AppConfig, LogEntry, SourceSpec } from "../../types";
import { parseLine } from "../parseLine";
import type { SourceEvents, SourceHandle } from "./types";

export function startFileSource(
  source: SourceSpec,
  events: SourceEvents,
  config: AppConfig,
): SourceHandle {
  const stream = fs.createReadStream(source.filePath!, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
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
    const batch: LogEntry[] = [];
    try {
      for await (const line of rl) {
        lineNumber += 1;
        batch.push(parseLine(line, { sourceId: source.id, sourceLabel: source.label, lineNumber }, config));
        if (batch.length >= 200) {
          events.onEntries(source.id, batch.splice(0, batch.length));
        }
      }
      if (batch.length > 0) {
        events.onEntries(source.id, batch);
      }
      finish(`Loaded file source ${source.label}`);
    } catch (error) {
      finish(`File source error: ${error instanceof Error ? error.message : String(error)}`);
    }
  })();

  return {
    close() {
      rl.close();
      stream.close();
      finish();
    },
  };
}
