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
  // Named pipes (FIFOs) are treated as continuous streams: no batching for
  // low latency, and "stream ended" rather than "Loaded" on completion.
  let isFifo = false;
  try {
    isFifo = fs.statSync(source.filePath!).isFIFO();
  } catch { /* treat as regular file if stat fails */ }

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
        const entry = parseLine(line, { sourceId: source.id, sourceLabel: source.label, lineNumber }, config);
        if (isFifo) {
          // Stream each line immediately — no batching for named pipes
          events.onEntries(source.id, [entry]);
        } else {
          batch.push(entry);
          if (batch.length >= 200) {
            events.onEntries(source.id, batch.splice(0, batch.length));
          }
        }
      }
      if (batch.length > 0) {
        events.onEntries(source.id, batch);
      }
      finish(isFifo ? `${source.label} stream ended` : `Loaded file source ${source.label}`);
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
