# ADR 0002: Mixed Log Entry Model

## Status

Accepted

## Decision

Use one normalized `LogEntry` type for JSON, prefixed JSON, and plain text.

## Consequences

- One list and one detail pane can render all input kinds
- Heuristic extraction and fallback preview live in one parsing path
