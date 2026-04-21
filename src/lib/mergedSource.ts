import type { SourceState } from "../types";
import { deriveMergedSelectionIndex, mergeEntriesByTime } from "./merge";

export function createMergedSourceState(
  sources: SourceState[],
  mergedState: {
    selectedIndex: number;
    follow: boolean;
    reverse: boolean;
    filter: string;
    query: string;
    expandedPaths: string[];
    detailCursor: number;
  },
): SourceState {
  const seed = sources[0] ?? {
    spec: { id: "merged", label: "all sources", kind: "file" as const },
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
  const mergedEntries = mergeEntriesByTime(sources.map(source => source.entries), mergedState.reverse);
  const jsonCount = mergedEntries.filter(entry => entry.kind === "json").length;

  return {
    ...seed,
    spec: { id: "merged", label: "all sources", kind: "file" },
    entries: mergedEntries,
    droppedCount: sources.reduce((sum, source) => sum + source.droppedCount, 0),
    jsonCount,
    textCount: mergedEntries.length - jsonCount,
    follow: mergedState.follow,
    reverse: mergedState.reverse,
    filter: mergedState.filter,
    query: mergedState.query,
    expandedPaths: mergedState.expandedPaths,
    detailCursor: mergedState.detailCursor,
    selectedIndex: deriveMergedSelectionIndex(
      mergedState.selectedIndex,
      mergedEntries.length,
      mergedState.follow,
    ),
  };
}
