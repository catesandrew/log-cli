import readline from "node:readline";
import type { SourceSpec } from "../../types";
import { parseLine } from "../parseLine";
import type { SourceEvents, SourceHandle } from "./types";

export function startStdinSource(source: SourceSpec, events: SourceEvents): SourceHandle {
  process.stdin.setEncoding("utf8");
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  let lineNumber = 0;
  void (async () => {
    for await (const line of rl) {
      lineNumber += 1;
      events.onEntries(source.id, [parseLine(line, { sourceId: source.id, lineNumber })]);
    }
    events.onStatus("stdin stream completed");
  })();

  return {
    close() {
      rl.close();
    },
  };
}
