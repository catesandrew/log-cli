import type { SourceSpec } from "../../types";
import { parseLine } from "../parseLine";
import { splitChunkBuffer } from "./lineChunks";
import type { SourceEvents, SourceHandle } from "./types";

export function startUrlSource(source: SourceSpec, events: SourceEvents): SourceHandle {
  const abortController = new AbortController();

  void (async () => {
    const response = await fetch(source.url!, { signal: abortController.signal });
    if (!response.body) {
      events.onStatus(`URL source ${source.label} returned no body`);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let lineNumber = 0;
    let rest = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const { lines, rest: nextRest } = splitChunkBuffer(rest, decoder.decode(value, { stream: true }));
      rest = nextRest;
      if (lines.length > 0) {
        const entries = lines.map(line => {
          lineNumber += 1;
          return parseLine(line, { sourceId: source.id, lineNumber });
        });
        events.onEntries(source.id, entries);
      }
    }

    if (rest.length > 0) {
      lineNumber += 1;
      events.onEntries(source.id, [parseLine(rest, { sourceId: source.id, lineNumber })]);
    }

    events.onStatus(`URL source ${source.label} completed`);
  })().catch(error => {
    if (!abortController.signal.aborted) {
      events.onStatus(`URL source error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  return {
    close() {
      abortController.abort();
    },
  };
}
