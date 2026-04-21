import type { LogEntry } from "../types";

const DEFAULT_SNIPPETS = [
  'level = "error"',
  'exists(user.id)',
  'level in ("warn","error")',
  'message like "timeout"',
  'message =~ /health/',
];

export function buildQuerySuggestions(entries: LogEntry[], input: string): string[] {
  const query = input.trim().toLowerCase();
  const fieldNames = new Set<string>();
  for (const entry of entries) {
    for (const key of Object.keys(entry.fieldIndex)) {
      fieldNames.add(key);
    }
  }

  const fieldSuggestions = [...fieldNames]
    .sort()
    .map(field => `${field} = ""`);

  const combined = [...DEFAULT_SNIPPETS, ...fieldSuggestions];
  if (!query) {
    return combined.slice(0, 6);
  }

  return combined.filter(item => item.toLowerCase().includes(query)).slice(0, 8);
}

export function buildInlineCompletion(input: string, suggestion: string): string {
  if (!input) {
    return suggestion;
  }
  if (suggestion.toLowerCase().startsWith(input.toLowerCase())) {
    return suggestion.slice(input.length);
  }
  return "";
}
