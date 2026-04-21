import type { LogEntry } from "../types";

export function mergeEntriesByTime(entrySets: LogEntry[][], reverse: boolean): LogEntry[] {
  const merged = entrySets.flat();
  merged.sort((a, b) => {
    const timeA = a.timestampMs ?? Number.MAX_SAFE_INTEGER;
    const timeB = b.timestampMs ?? Number.MAX_SAFE_INTEGER;
    if (timeA !== timeB) {
      return reverse ? timeB - timeA : timeA - timeB;
    }
    return reverse ? b.lineNumber - a.lineNumber : a.lineNumber - b.lineNumber;
  });
  return merged;
}
