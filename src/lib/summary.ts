import type { LogEntry, SourceSpec } from "../types";

export function buildSummary(
  sources: SourceSpec[],
  entriesBySource: Map<string, LogEntry[]>,
): {
  sources: Array<{ id: string; label: string; entries: number; json: number; text: number }>;
  totalEntries: number;
} {
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
  };
}
