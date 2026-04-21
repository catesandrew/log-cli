import type { AppConfig, AppState, SourceSpec, SourceState } from "../types";

function createSourceState(spec: SourceSpec): SourceState {
  return {
    spec,
    entries: [],
    droppedCount: 0,
    jsonCount: 0,
    textCount: 0,
    filter: "",
    query: "",
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
    mergedView: false,
    focusMode: "list",
    detailMode: "tree",
    filterDraft: "",
    queryDraft: "",
    detailSearchDraft: "",
    detailSearchTerm: "",
    detailSearchMatches: [],
    statusLine: `Loaded ${sources.length} source(s).`,
    fps: 0,
    lastFlushSize: 0,
    ingesting: true,
    showHelp: false,
    config,
  };
}
