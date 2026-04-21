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

function abbreviateSource(label: string | undefined): string {
  if (!label) return "SRC";
  const stem = label.replace(/\.[^.]+$/, "").replace(/[^A-Za-z0-9]/g, "");
  if (!stem) return "SRC";
  const digitSuffix = /\d+$/.exec(stem)?.[0] ?? "";
  const letters = stem.slice(0, stem.length - digitSuffix.length);
  const base = letters.slice(0, 3).toUpperCase() || "SRC";
  return `${base}${digitSuffix}`.slice(0, 4);
}

export function getMergedEntryMeta(entry: LogEntry, previous: LogEntry | undefined): {
  sourceMarker: string;
  sourceChanged: boolean;
} {
  return {
    sourceMarker: abbreviateSource(entry.sourceLabel),
    sourceChanged: !previous || previous.sourceId !== entry.sourceId,
  };
}

export function formatMergedBoundaryLabel(entry: LogEntry): string {
  const marker = abbreviateSource(entry.sourceLabel);
  return `${marker}: ${entry.sourceLabel ?? entry.sourceId}`;
}

export function formatMergedSourceSummary(
  labels: string[],
  maxWidth: number,
  options?: {
    filterActive?: boolean;
    queryActive?: boolean;
    reverseActive?: boolean;
    followActive?: boolean;
  },
): string {
  const prefix = `merged(${labels.length}): `;
  const body = labels.join(", ");
  const suffixParts = [
    ...(options?.filterActive ? ["filter"] : []),
    ...(options?.queryActive ? ["query"] : []),
    ...(options?.reverseActive ? ["reverse"] : []),
    ...(options?.followActive === false ? ["nofollow"] : []),
  ];
  const suffix = suffixParts.length > 0 ? ` [${suffixParts.join("+")}]` : "";
  const full = `${prefix}${body}${suffix}`;
  if (full.length <= maxWidth) {
    return full;
  }

  if (prefix.length >= maxWidth) {
    return prefix.slice(0, Math.max(0, maxWidth - 1)) + "…";
  }

  return `${prefix}${body.slice(0, Math.max(0, maxWidth - prefix.length - 1))}…`;
}

export function deriveMergedSelectionIndex(
  currentIndex: number,
  totalEntries: number,
  follow: boolean,
): number {
  if (totalEntries <= 0) {
    return 0;
  }

  if (follow) {
    return totalEntries - 1;
  }

  return Math.min(Math.max(0, currentIndex), totalEntries - 1);
}
