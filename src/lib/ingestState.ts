import type { LogEntry, SourceState } from "../types";

export function applyEntryBatch(
  source: SourceState,
  batch: LogEntry[],
  maxEntries: number,
): SourceState {
  if (batch.length === 0) {
    return source;
  }

  const merged = [...source.entries, ...batch];
  const overflow = Math.max(0, merged.length - maxEntries);
  const entries = overflow > 0 ? merged.slice(overflow) : merged;
  const droppedCount = source.droppedCount + overflow;
  const jsonCount = entries.filter(entry => entry.kind === "json").length;
  const textCount = entries.length - jsonCount;
  const selectedIndex = source.follow
    ? Math.max(0, entries.length - 1)
    : Math.min(source.selectedIndex, Math.max(0, entries.length - 1));

  return {
    ...source,
    entries,
    droppedCount,
    jsonCount,
    textCount,
    selectedIndex,
  };
}
