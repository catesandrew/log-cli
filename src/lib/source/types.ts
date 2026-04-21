import type { LogEntry, SourceSpec } from "../../types";

export type SourceEvents = {
  onEntries: (sourceId: string, entries: LogEntry[]) => void;
  onStatus: (message: string) => void;
  onSourceReady: (source: SourceSpec) => void;
  onSourceDone: (sourceId: string) => void;
};

export type SourceHandle = {
  close: () => void;
};
