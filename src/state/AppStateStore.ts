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
    levelFilter: [],
    follow: true,
    reverse: false,
    selectedIndex: 0,
    expandedPaths: ["root"],
    detailCursor: 0,
  };
}

export function buildStartupStatusLine(
  sourceCount: number,
  options?: {
    mergedView?: boolean;
    defaultFilter?: string;
    defaultQuery?: string;
    follow?: boolean;
    reverse?: boolean;
  },
): string {
  const mergeRequested = Boolean(options?.mergedView);
  const mergedView = Boolean(mergeRequested && sourceCount > 1);
  const startupModes = [
    ...(options?.defaultFilter ? ["filter"] : []),
    ...(options?.defaultQuery ? ["query"] : []),
    ...(options?.reverse ? ["reverse"] : []),
    ...(options?.follow === false ? ["nofollow"] : []),
  ];
  if (mergeRequested && sourceCount <= 1) {
    return `Loaded ${sourceCount} source(s). Merge ignored without multiple sources.`;
  }
  return mergedView
    ? `Loaded ${sourceCount} source(s) in merged view${startupModes.length ? ` with ${startupModes.join(" + ")}` : ""}.`
    : `Loaded ${sourceCount} source(s)${startupModes.length ? ` with ${startupModes.join(" + ")}` : ""}.`;
}

export function getDefaultAppState(
  sources: SourceSpec[],
  config: AppConfig,
  options?: {
    mergedView?: boolean;
    defaultFilter?: string;
    defaultQuery?: string;
    follow?: boolean;
    reverse?: boolean;
  },
): AppState {
  const mergeRequested = Boolean(options?.mergedView);
  const mergedView = Boolean(mergeRequested && sources.length > 1);
  const mergeIgnored = Boolean(mergeRequested && sources.length <= 1);
  const defaultFilter = options?.defaultFilter ?? "";
  const defaultQuery = options?.defaultQuery ?? "";
  const follow = options?.follow ?? true;
  const reverse = options?.reverse ?? false;
  const startupStatus = buildStartupStatusLine(sources.length, {
    mergedView: mergeRequested,
    defaultFilter,
    defaultQuery,
    follow,
    reverse,
  });
  return {
    sources: sources.map(spec => ({
      ...createSourceState(spec),
      filter: defaultFilter,
      query: defaultQuery,
      levelFilter: [],
      follow,
      reverse,
    })),
    activeSourceIndex: 0,
    mergedView,
    mergeIgnored,
    mergedSelectedIndex: 0,
    mergedFollow: follow,
    mergedReverse: reverse,
    mergedFilter: defaultFilter,
    mergedQuery: defaultQuery,
    mergedLevelFilter: [],
    mergedExpandedPaths: ["root"],
    mergedDetailCursor: 0,
    startupStatus,
    focusMode: "list",
    detailMode: "tree",
    filterDraft: "",
    queryDraft: "",
    querySuggestionIndex: 0,
    detailSearchDraft: "",
    detailSearchTerm: "",
    detailSearchMatches: [],
    statusLine: startupStatus,
    fps: 0,
    lastFlushSize: 0,
    ingesting: true,
    showHelp: false,
    config,
  };
}
