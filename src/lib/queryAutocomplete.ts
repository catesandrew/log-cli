import type { LogEntry } from "../types";

const DEFAULT_SNIPPETS = [
  'level = "error"',
  'exists(user.id)',
  'level in ("warn","error")',
  'message like "timeout"',
  'message =~ /health/',
];

export function extractActiveQueryFragment(input: string): string {
  const match = /([A-Za-z0-9_.-]+)$/.exec(input);
  return match?.[1] ?? "";
}

export function buildQuerySuggestions(entries: LogEntry[], input: string): string[] {
  const query = extractActiveQueryFragment(input).trim().toLowerCase();
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
  const fragment = extractActiveQueryFragment(input);
  if (!fragment) {
    return suggestion;
  }
  if (suggestion.toLowerCase().startsWith(fragment.toLowerCase())) {
    return suggestion.slice(fragment.length);
  }
  return "";
}

export function applySuggestionToQuery(input: string, suggestion: string): string {
  const fragment = extractActiveQueryFragment(input);
  if (!fragment) {
    return suggestion;
  }
  return `${input.slice(0, input.length - fragment.length)}${suggestion}`;
}
