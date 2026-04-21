# Onboarding

`log` is built from the `/usr/local/personal/mock-tui-platform` architecture seed, but the mock app catalog has been replaced by a real mixed-log domain.

## Architecture spine

1. `src/cli.ts`
2. `src/main.tsx`
3. `src/ink.tsx` / `src/interactiveHelpers.tsx`
4. `src/replLauncher.tsx`
5. `src/state/AppState.tsx` / `src/state/AppStateStore.ts`
6. `src/screens/LogScreen.tsx`
7. `src/lib/source/*`
8. `src/lib/parseLine.ts`
9. `src/lib/ringBuffer.ts`

## Core rules

- Keep ingest/parsing under `src/lib/`
- Keep UI state in the external store
- Keep the list virtualized
- Keep updates batched for high-volume streams
- Do not bypass the source manager to push lines into state directly

## Verification

```bash
bun run typecheck
bun test
bun run test:e2e
bun run build
```
