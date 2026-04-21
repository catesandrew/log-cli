import type { AppConfig, AppState, SourceSpec, SourceState } from "../types";

function createSourceState(spec: SourceSpec): SourceState {
  return {
    spec,
    entries: [],
    droppedCount: 0,
    jsonCount: 0,
    textCount: 0,
    filter: "",
    follow: true,
    reverse: false,
    selectedIndex: 0,
    expandedPaths: ["root"],
    detailCursor: 0,
  };
}

export function getDefaultAppState(sources: SourceSpec[], config: AppConfig): AppState {
  return {
    sources: sources.map(createSourceState),
    activeSourceIndex: 0,
    focusMode: "list",
    detailMode: "tree",
    filterDraft: "",
    statusLine: `Loaded ${sources.length} source(s).`,
    fps: 0,
    lastFlushSize: 0,
    ingesting: true,
    showHelp: false,
    config,
  };
}
