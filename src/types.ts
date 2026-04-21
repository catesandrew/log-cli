export type NormalizedLevel =
  | "trace"
  | "debug"
  | "info"
  | "warn"
  | "error"
  | "fatal"
  | "unknown";

export type EntryKind = "json" | "text";
export type DetailMode = "tree" | "raw";
export type FocusMode = "list" | "detail" | "filter" | "query" | "search" | "help";
export type SourceKind = "file" | "stdin" | "url" | "cmd";

export type LogEntry = {
  id: string;
  sourceId: string;
  sourceLabel?: string;
  lineNumber: number;
  raw: string;
  prefix?: string;
  kind: EntryKind;
  jsonValue?: unknown;
  message: string;
  preview: string;
  text: string;
  timeText?: string;
  timestampMs?: number;
  levelRaw?: string;
  levelNormalized: NormalizedLevel | string;
  fieldIndex: Record<string, string>;
  searchText: string;
};

export type SourceSpec = {
  id: string;
  label: string;
  kind: SourceKind;
  filePath?: string;
  url?: string;
  command?: string;
};

export type SourceState = {
  spec: SourceSpec;
  entries: LogEntry[];
  droppedCount: number;
  jsonCount: number;
  textCount: number;
  filter: string;
  query: string;
  levelFilter: NormalizedLevel[];
  follow: boolean;
  reverse: boolean;
  selectedIndex: number;
  expandedPaths: string[];
  detailCursor: number;
};

export type ColumnConfig = {
  key: string;
  label: string;
  width: number;
};

export type AppConfig = {
  maxEntries: number;
  batchMs: number;
  columns: ColumnConfig[];
  preserveAnsiText: boolean;
  mainLineTemplate?: string;
  placeholderFormat?: string;
  contextPath?: string;
  levelMap: Record<string, NormalizedLevel>;
};

export type AppState = {
  sources: SourceState[];
  activeSourceIndex: number;
  mergedView: boolean;
  mergeIgnored: boolean;
  mergedSelectedIndex: number;
  mergedFollow: boolean;
  mergedReverse: boolean;
  mergedFilter: string;
  mergedQuery: string;
  mergedLevelFilter: NormalizedLevel[];
  mergedExpandedPaths: string[];
  mergedDetailCursor: number;
  startupStatus: string;
  focusMode: FocusMode;
  detailMode: DetailMode;
  filterDraft: string;
  queryDraft: string;
  querySuggestionIndex: number;
  detailSearchDraft: string;
  detailSearchTerm: string;
  detailSearchMatches: number[];
  statusLine: string;
  fps: number;
  lastFlushSize: number;
  ingesting: boolean;
  showHelp: boolean;
  config: AppConfig;
};

export type SourceBatch = {
  sourceId: string;
  entries: LogEntry[];
};

export type JsonTreeRow = {
  path: string;
  depth: number;
  keyLabel: string;
  valueLabel: string;
  expandable: boolean;
  expanded: boolean;
};

export type AnsiSegment = {
  text: string;
  color?: "red" | "green" | "yellow" | "blue" | "magenta" | "cyan" | "white";
  bold?: boolean;
};
