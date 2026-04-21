import type { LogEntry, SourceSpec } from "../types";
import { buildFilter } from "./filter";
import { buildQuery } from "./query";

export type SummaryOutput = {
  sources: Array<{ id: string; label: string; entries: number; json: number; text: number }>;
  totalEntries: number;
  metadata?: {
    mergedRequested: boolean;
    mergedActive: boolean;
    reverse: boolean;
    follow: boolean;
    filter?: string;
    query?: string;
  };
};

export function buildSummary(
  sources: SourceSpec[],
  entriesBySource: Map<string, LogEntry[]>,
  metadata?: SummaryOutput["metadata"],
): SummaryOutput {
  const sourceSummaries = sources.map(source => {
    const entries = entriesBySource.get(source.id) ?? [];
    const json = entries.filter(entry => entry.kind === "json").length;
    const text = entries.length - json;
    return {
      id: source.id,
      label: source.label,
      entries: entries.length,
      json,
      text,
    };
  });

  return {
    sources: sourceSummaries,
    totalEntries: sourceSummaries.reduce((sum, source) => sum + source.entries, 0),
    ...(metadata ? { metadata } : {}),
  };
}

export function buildFilteredSummary(
  sources: SourceSpec[],
  entriesBySource: Map<string, LogEntry[]>,
  filterText: string,
  queryText: string,
  metadata?: SummaryOutput["metadata"],
): SummaryOutput {
  const filter = buildFilter(filterText);
  const query = buildQuery(queryText);
  const filtered = new Map<string, LogEntry[]>();
  for (const [sourceId, entries] of entriesBySource) {
    filtered.set(sourceId, entries.filter(entry => filter(entry) && query(entry)));
  }
  return buildSummary(sources, filtered, metadata);
}
