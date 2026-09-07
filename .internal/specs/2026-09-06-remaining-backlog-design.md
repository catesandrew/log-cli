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
debt/robustness, test coverage, packaging/distribution. Decomposed into 5
independent epics (per project size — see "Working in existing codebases" /
sub-project decomposition guidance): CI/Test-Suite Health, Test Coverage
Expansion, Feature Enhancements, Packaging & Distribution, and Tech Debt /
Robustness. Each epic gets its own `omc-plan` (consensus + architect review)
before beads are seeded for its child steps, per explicit user instruction —
this deviates from brainstorming's normal "terminal state is writing-plans"
default; the user's direct instruction takes precedence.

**Process note:** an earlier pass through this spec skipped the design
approval and spec-review gates that normally happen here (a research
subagent went out of scope and self-approved). The tech-debt/robustness
findings below (Epic 5) were dropped in that pass and have been restored;
this version is the one actually being presented to the user for approval.

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
1. Restore/create `examples/mixed.log` and `examples/mixed-2.log`.
   Acceptance criterion: content must satisfy every assertion in
   `tests/e2e-smoke.test.ts` (all 8 currently-failing cases pass) and every
   reference to these files in `README.md`. Do not hand-guess exact byte
   content in the plan — derive it deterministically from the full test file
   at implementation time. [S]
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

## Epic 3 — Feature Enhancements (P3, lower priority than Epics 1/2/4)

Grounded in absence-of-feature rather than a concrete bug/gap/test failure —
no user-demand evidence exists for any of these items. Kept in the backlog
since each is plausible and well-scoped, but deprioritized relative to the
CI-health, coverage, and packaging epics.

Confirmed via README (full feature list) and grep — none of the following
exist today:

1. Query-language parity with filter language — `src/lib/query.ts` (221
   lines) supports only `=`, `like`, `=~`, `exists`, `in`, `and/or/not`;
   `src/lib/filter.ts` (443 lines) additionally supports `!=`, numeric
   comparisons, `!~=`/wildcard `like`, `~~=` regex, `not exists`, `not in`,
   optional-path `?`, nested/array-wildcard/array-index paths. README itself
   documents the asymmetry (10 operator families for filter vs. 6 for
   query). Query mode (`Q`/`--query`) is materially weaker than filter mode
   (`F`/`--filter`) for no evident reason. [M/L]
2. CLI-level quick level filter — TUI has `1`..`6` keys for
   trace/debug/info/warn/error/fatal (wired in `LogScreen.tsx`), but
   `src/lib/argv.ts` has no `--level` equivalent for non-interactive/startup
   use, forcing a full `--filter 'level in (...)'` expression. [S]
3. Missing `--version`/`-V` flag — `argv.ts` defines `--help`/`-h` but no
   version flag; `package.json` carries `"version": "0.1.0"` with no CLI
   surface for it. [S]
4. Directory/glob file sources — `resolveSources` in `src/lib/sources.ts`
   only accepts explicit file paths, no glob expansion or directory-of-logs
   support, despite already accepting multiple positional files and merge
   mode across them. [M]
5. Named/saved filters — persist a named filter expression to config, recall
   by name instead of retyping. [M]
6. List-level search — today `/` search only works in detail-pane
   (`src/lib/textSearch.ts`, `src/lib/detailActions.ts`); no equivalent for
   the log list itself. [M]
7. Export/pipe filtered+queried results to a file — today only
   `--summary-json`/`--summary-text` exist as headless output modes; no way
   to dump the filtered/queried entry set itself. [M]
8. Configurable level-color theme — color helpers (`red`, `yellow`, `green`,
   etc. in `mainLineTemplate.ts`) are fixed; no user-configurable theme/color
   mapping. [S/M]
9. Bookmarks/marks in the list for quick jump-back during a long session. [M]

## Epic 5 — Tech Debt / Robustness (P1)

Grounded directly in `src/lib/*` and `src/lib/source/*` read-through against
`docs/ONBOARDING.md`'s stated core rules and ADR-0001's "some copied shell
files remain generic and may be simplified later" note. Independent of
Epic 1's CI/fixture root cause — these are latent robustness gaps in shipped
code paths, not test-suite health.

1. Silent config parse failures — `src/lib/config.ts` `readConfigFile`
   swallows all errors (bad JSON, schema violation) and silently falls back
   to defaults; a typo in `.log.jsonc` produces no error. [S]
2. URL source ignores HTTP error status — `src/lib/source/urlSource.ts`
   checks only `response.body` presence, never `response.ok`/status; a
   404/500 streams its error-page body as log lines instead of failing
   clearly. [S]
3. No fetch timeout/retry for URL source — a hung connection blocks forever
   with no user-facing indication beyond a stuck TUI. [S/M]
4. `cmdSource` stdout+stderr interleaving is racy — two independent
   readline loops with no ordering guarantee; acceptable behavior but
   undocumented and untested as such. [S]
5. File source TOCTOU race reporting lacks path context — `fileSource.ts`
   stats for FIFO detection then opens separately; a race (file removed
   between calls) is caught but reported only as a raw fs error with no
   path reinserted for user clarity. [S]
6. `validateSources` doesn't validate `--url`/`--cmd` shape — only
   file-kind sources are validated (existence, not-a-directory); malformed
   `--url`/empty `--cmd` defers to a runtime failure instead of failing
   fast. [S]
7. Graceful shutdown/cleanup gap — cleanup (`sourceManager.close()`) relies
   on `finally { renderContext.dispose() }` in the interactive path; Ink's
   `exitOnCtrlC: true` calls `process.exit` directly, which may skip that
   `finally` for spawned child processes / open file handles on early
   interactive-path exit. Needs a signal handler that calls close()
   explicitly before exit. [S/M]
8. Dead config flag — `preserveAnsiText` is declared and validated in
   `src/lib/config.ts` and `src/types.ts` but has zero read-sites outside
   the schema; ANSI preservation in text detail is unconditional. Wire it up
   or remove the dead config surface. [S]
9. ADR-0001 re-audit follow-up — `src/ink.tsx`, `src/ink-runtime.ts`,
   `src/main.tsx`, `src/replLauncher.tsx`, `src/interactiveHelpers.tsx` were
   read and found lean/log-cli-specific already (recommend closing that part
   of ADR-0001's concern as resolved); `src/state/*` and `src/components/*`
   were not yet audited for the same copied-shell concern — do that as part
   of this item. [S, audit]

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
review) against that epic to produce an implementation plan — uniformly,
including small epics like Epic 1. Seed beads from the produced plan as
child tasks under the epic, with parent-child deps + embedded acceptance
criteria, then `bd dep add`/`bd batch` for ordering between steps.

Known cross-item dependencies to encode:
- Epic 1 item 2 (re-enable `bun test` in CI) is blocked by Epic 1 item 1
  (fixture restore).
- Epic 1 item 3 (add `test:e2e`/`build` to CI) can run in parallel with item 2.
- Epic 2, Epic 3, and Epic 5 items have no hard dependency on Epic 1 or each
  other, but Epic 5 items 2/3/4/6/7 (source-module robustness fixes) and
  Epic 2 item 2 (source-module unit tests) are natural pairs to implement
  together — soft ordering suggestion, not a hard `bd dep`.
- Epic 4 items have no hard dependency on Epic 1 being green, though
  verifying `build:exe` (item 1) is more meaningful once the suite is green.

## Out of scope / explicitly deferred

- No speculative features beyond what's listed (YAGNI) — e.g. no plugin
  system, no remote/multi-user mode, no GUI, nothing not grounded in a gap
  found by direct repo inspection.

## Stress Test Results: remaining-backlog design

### Resolved Decisions
- Security (cmdSource/urlSource take user-supplied command/URL): same trust
  boundary as the invoking user's own shell — N/A, no design change.
- Fixture-content risk: don't pin guessed byte content in the spec; Epic 1
  item 1's acceptance criterion is "satisfies every assertion in
  tests/e2e-smoke.test.ts and README.md" instead.
- Plan overhead: keep uniform omc-plan (consensus + architect) for every
  epic, no exceptions for small ones.
- Epic 3 priority: kept all 5 items, marked P3/lower priority than Epics
  1/2/4 since it's the only speculative (non-gap-driven) epic.
- Epic dependencies: pinned explicitly (Epic1.2 blocked-by Epic1.1; Epic1.3
  parallel with Epic1.2; Epic2/Epic3 independent; Epic4 has no hard
  dependency on Epic1).
- Epic grouping: Epic 1 and Epic 2 stay separate — different urgency
  (P0 bug fix vs. ongoing coverage work).
- Plan authority: each epic's own omc-plan (consensus + architect) is
  authoritative for that epic's final child breakdown; this doc's item
  lists are a starting proposal, not a locked spec.

### Changes Made
- Epic 1 item 1: replaced guessed fixture content with an acceptance
  criterion.
- Epic 3: added priority/rationale framing (P3, deprioritized).
- Process section: replaced vague dependency example with explicit
  cross-item dependencies; added "uniformly, including small epics."

### Deferred / Parking Lot
- None.

### Confidence Assessment
- Overall: High
- Areas of concern: none remaining; Epic 1's root cause is directly
  confirmed (git history + failing test run), not inferred.
