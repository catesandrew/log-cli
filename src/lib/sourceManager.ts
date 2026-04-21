import type { AppConfig, LogEntry, SourceSpec } from "../types";
import { RingBuffer } from "./ringBuffer";
import { startCmdSource } from "./source/cmdSource";
import { startFileSource } from "./source/fileSource";
import { startStdinSource } from "./source/stdinSource";
import { startUrlSource } from "./source/urlSource";
import type { SourceHandle } from "./source/types";

type Events = {
  onBatch: (sourceId: string, entries: LogEntry[], droppedCount: number) => void;
  onStatus: (message: string) => void;
};

export function createSourceManagerHarness(
  sources: SourceSpec[],
  config: AppConfig,
  events: Events,
): {
  onEntries: (sourceId: string, entries: LogEntry[]) => void;
  flush: () => void;
  close: () => void;
} {
  const handles: SourceHandle[] = [];
  const pending = new Map<string, LogEntry[]>();
  const buffers = new Map<string, RingBuffer<LogEntry>>();

  for (const source of sources) {
    buffers.set(source.id, new RingBuffer<LogEntry>(config.maxEntries));
  }

  const flush = () => {
    for (const [sourceId, entries] of pending) {
      if (entries.length === 0) continue;
      const buffer = buffers.get(sourceId)!;
      buffer.push(entries);
      pending.set(sourceId, []);
      events.onBatch(sourceId, buffer.toArray(), buffer.droppedCount);
    }
  };

  const onEntries = (sourceId: string, entries: LogEntry[]) => {
    const current = pending.get(sourceId) ?? [];
    current.push(...entries);
    pending.set(sourceId, current);
  };

  for (const source of sources) {
    const commonEvents = {
      onEntries,
      onStatus: events.onStatus,
      onSourceReady: () => {},
    };
    switch (source.kind) {
      case "file":
        handles.push(startFileSource(source, commonEvents));
        break;
      case "stdin":
        handles.push(startStdinSource(source, commonEvents));
        break;
      case "url":
        handles.push(startUrlSource(source, commonEvents));
        break;
      case "cmd":
        handles.push(startCmdSource(source, commonEvents));
        break;
    }
  }

  return {
    onEntries,
    flush,
    close: () => {
      flush();
      for (const handle of handles) {
        handle.close();
      }
    },
  };
}

export function startSourceManager(
  sources: SourceSpec[],
  config: AppConfig,
  events: Events,
): () => void {
  const harness = createSourceManagerHarness(sources, config, events);
  const interval = setInterval(harness.flush, config.batchMs);

  return () => {
    clearInterval(interval);
    harness.close();
  };
}
