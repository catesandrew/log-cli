# log-cli Remaining Backlog — Design

## Context

No `.omc/plans/*.md` exist in this repo. `docs/**/*.md` (4 ADRs, ONBOARDING.md,
README.md) describe only already-shipped behavior — all ADRs are `Accepted`
with no open items, and no TODO/FIXME/"not implemented" markers exist anywhere
in `src/`, `tests/`, or `docs/`. Beads DB was empty at the start of this
session. This spec exists to seed a *real*, evidence-grounded backlog rather
than fabricate speculative work.

KB check: none (fresh beads DB, no prior decisions/memories for this repo).

## Scope

Brainstormed and confirmed with the user across 4 areas: feature gaps, tech
debt/robustness, test coverage, packaging/distribution. Decomposed into 4
independent epics (per project size — see "Working in existing codebases" /
sub-project decomposition guidance). Each epic gets its own `omc-plan`
(consensus + architect review) before beads are seeded for its child steps,
per explicit user instruction — this deviates from brainstorming's normal
"terminal state is writing-plans" default; the user's direct instruction
takes precedence.

## Epic 1 — CI/Test-Suite Health (P0)

**Root cause, confirmed by direct investigation:** `examples/mixed.log` and
`examples/mixed-2.log` have never existed in this repo's git history
(`git log --all -- examples/mixed.log examples/mixed-2.log` returns nothing),
yet README.md references them in 9 places and
`tests/e2e-smoke.test.ts` spawns the CLI against them in 8 test cases. Running
`bun test` today produces exactly **8 failures, 85 passes** — all 8 failures
are the tests that reference these two missing files. `.github/workflows/ci.yml`
has a comment explaining `bun test` was deliberately left out of CI because of
these "8 pre-existing test failures," which permanently blocks the agent-ops
auto-merge gate (`ciState === "success"` requirement).

Items:
1. Restore/create `examples/mixed.log` and `examples/mixed-2.log` fixture
   content matching what tests and README expect (mixed.log: 5 entries / 3
   json / 2 text, containing at least one `level="error"` entry with
   `message` containing `timeout`; mixed-2.log: compatible content for merge
   tests expecting `totalEntries: 2` under `message:line` filter and
   `level = "unknown"` query). Fixes all 8 failing tests. [S]
2. Re-enable `bun test` in `.github/workflows/ci.yml` once green, remove the
   explanatory comment. [S]
3. Add `bun run test:e2e` and `bun run build` as CI steps (currently CI only
   runs `typecheck`). [S]

## Epic 2 — Test Coverage Expansion

Confirmed by cross-referencing `src/` file list against `tests/*.test.ts(x)`
by name correspondence:

1. Unit tests for `src/lib/pathValue.ts` (110 lines) — nested/array-wildcard
   path resolution used by `filter.ts` and `parseLine.ts`; no dedicated test
   file exists today, only indirect coverage via `filter.test.ts`. [S]
2. Unit tests for `src/lib/source/{cmdSource,fileSource,urlSource,
   stdinSource,lineChunks}.ts` individually — each has only 0-2 `catch` sites
   and no per-file test (only `sourceManager.test.ts` and
   `mergedSource.test.ts` exist at a higher level). Cover spawn failure,
   network error, malformed chunk handling. [M]
3. Unit tests for `src/utils/{id,time,handlePromptSubmit}.ts` — no test
   files exist for any of the 3. [S]
4. Unit tests for `src/hooks/{useTerminalSize,useVirtualWindow}.ts` — no
   test files exist. [S]
5. Component tests for `FilterBar`, `QueryBar`, `SearchBar`, and JsonTree
   fold/unfold interaction — not covered individually (only indirectly via
   `e2e-smoke.test.ts` and `mergedList.test.tsx`). [M]

## Epic 3 — Feature Enhancements

Confirmed via README (full feature list) and grep — none of the following
exist today:

1. Named/saved filters — persist a named filter expression to config, recall
   by name instead of retyping. [M]
2. List-level search — today `/` search only works in detail-pane
   (`src/lib/textSearch.ts`, `src/lib/detailActions.ts`); no equivalent for
   the log list itself. [M]
3. Export/pipe filtered+queried results to a file — today only
   `--summary-json`/`--summary-text` exist as headless output modes; no way
   to dump the filtered/queried entry set itself. [M]
4. Configurable level-color theme — color helpers (`red`, `yellow`, `green`,
   etc. in `mainLineTemplate.ts`) are fixed; no user-configurable theme/color
   mapping. [S/M]
5. Bookmarks/marks in the list for quick jump-back during a long session. [M]

## Epic 4 — Packaging & Distribution

Confirmed via `package.json`, `bin/log`, `knowledge-base/config.yml`, and
`.github/workflows/ci.yml`:

1. Verify/document the `build:exe` standalone binary (`bun build --compile`)
   across macOS/Linux — script exists but isn't exercised in CI or documented
   beyond the one script line. [M]
2. Decide and document publish posture explicitly (stays private vs. npm
   publish) — currently only implicit via `knowledge-base/config.yml`'s
   `public_facing: false` note; no explicit decision doc. [S, decision]
3. Versioning/release process — `package.json` has sat at `0.1.0` since
   `first commit`; no CHANGELOG, no tags, no release script. [S]

## Process for each epic

Per explicit user instruction, each epic above becomes its own bead
(`type=epic`), then run `oh-my-claudecode:plan` (consensus + architect
review) against that epic to produce an implementation plan. Seed beads from
the produced plan as child tasks under the epic, with parent-child deps +
embedded acceptance criteria, then `bd dep add`/`bd batch` for ordering
between steps (e.g., Epic 1 item 2 depends on item 1; Epic 4 item 1 depends on
Epic 1 being green).

## Out of scope / explicitly deferred

- No speculative features beyond what's listed (YAGNI) — e.g. no plugin
  system, no remote/multi-user mode, no GUI, nothing not grounded in a gap
  found by direct repo inspection.
