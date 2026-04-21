# ADR 0003: Ring Buffer And Batched UI Updates

## Status

Accepted

## Decision

Use a max-sized ring buffer per source and coalesce ingest updates into UI batches.

## Consequences

- Continuous streams stay responsive
- Rendering cost is bounded
- Follow mode and counters must be updated from batched state transitions
