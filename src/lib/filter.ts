import type { LogEntry } from "../types";

function tokenMatches(entry: LogEntry, token: string): boolean {
  if (!token) return true;

  if (token.startsWith("/") && token.endsWith("/") && token.length > 2) {
    const pattern = token.slice(1, -1);
    return new RegExp(pattern, "i").test(entry.searchText);
  }

  const sepIndex = token.indexOf(":");
  if (sepIndex > 0) {
    const field = token.slice(0, sepIndex).toLowerCase();
    const value = token.slice(sepIndex + 1).toLowerCase();
    const fieldValue = entry.fieldIndex[field] ?? "";
    return fieldValue.toLowerCase().includes(value);
  }

  return entry.searchText.toLowerCase().includes(token.toLowerCase());
}

export function buildFilter(filterText: string): (entry: LogEntry) => boolean {
  const tokens = filterText
    .split(/\s+/)
    .map(token => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return () => true;
  }

  return (entry: LogEntry) => tokens.every(token => tokenMatches(entry, token));
}
