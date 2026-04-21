import fs from "node:fs";
import readline from "node:readline";
import type { LogEntry, SourceSpec } from "../../types";
import { parseLine } from "../parseLine";
import type { SourceEvents, SourceHandle } from "./types";

export function startFileSource(source: SourceSpec, events: SourceEvents): SourceHandle {
  const stream = fs.createReadStream(source.filePath!, { encoding: "utf8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let lineNumber = 0;

  void (async () => {
    const batch: LogEntry[] = [];
    for await (const line of rl) {
      lineNumber += 1;
      batch.push(parseLine(line, { sourceId: source.id, lineNumber }));
      if (batch.length >= 200) {
        events.onEntries(source.id, batch.splice(0, batch.length));
      }
    }
    if (batch.length > 0) {
      events.onEntries(source.id, batch);
    }
    events.onStatus(`Loaded file source ${source.label}`);
  })();

  return {
    close() {
      rl.close();
      stream.close();
    },
  };
}
