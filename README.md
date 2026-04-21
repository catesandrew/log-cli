# log

`log` is an interactive TUI for mixed web/server logs:

- JSON lines most of the time
- plain text lines sometimes
- prefixed JSON like `POD | {"level":"info","message":"..."}` as well

It accepts files, stdin, a streaming URL, or a spawned command.

## Features

- Left pane virtualized log list with follow mode
- Right pane JSON tree or raw text detail view
- Tabs for multiple file sources
- Merged view across all sources
- Ring buffer with configurable max size
- Batched ingest updates for fast streams
- Reverse ordering toggle
- Filter mode for substring and `field:value`
- Query mode with boolean expressions inspired by `hl`
- Detail-pane search and copy actions inspired by `jless`
- Basic ANSI color preservation for text detail
- Help modal
- Summary JSON / text mode for automation and smoke testing

## Run

```bash
bun install
bun run src/cli.ts examples/mixed.log
```

## Quick how-tos

Open a local file:

```bash
bun run src/cli.ts examples/mixed.log
```

Tail command output:

```bash
./bin/log --cmd "docker logs -f my-container 2>&1"
```

Read a URL stream:

```bash
./bin/log --url https://example.com/logs
```

Summarize mixed input as JSON:

```bash
bun run src/cli.ts examples/mixed.log --summary-json
```

Summarize piped stdin as text:

```bash
cat examples/mixed.log | bun run src/cli.ts --summary-text
```

## Input sources

Files:

```bash
bun run src/cli.ts server.log access.log
```

stdin:

```bash
cat examples/mixed.log | bun run src/cli.ts
```

URL stream:

```bash
bun run src/cli.ts -- --url https://example.com/logs
```

Command stream:

```bash
bun run src/cli.ts -- --cmd "docker logs -f my-container 2>&1"
```

Installed binary:

```bash
./bin/log --cmd "docker logs -f my-container 2>&1"
./bin/log --url https://example.com/logs
```

## Headless summary modes

JSON summary:

```bash
bun run src/cli.ts examples/mixed.log --summary-json
```

Text summary:

```bash
bun run src/cli.ts examples/mixed.log --summary-text
```

## Keybindings

- `↑/↓` or `j/k`: move selection
- `PgUp/PgDn`: move by page
- `Home/End`, `g/G`: jump top/bottom
- `Enter`: toggle focus into detail pane
- `Esc`: back to list / close modal
- `Space`: fold/unfold JSON node in detail pane
- `R`: reverse ordering
- `F`: filter mode
- `Q`: query editor mode
- `/`: detail search mode
- `n` / `N`: next/previous detail search match
- `Tab`: next source tab
- `Shift+Tab`: previous source tab
- `M`: toggle merged view
- `m`: toggle detail mode (`tree` / `raw`)
- `yy`, `yp`, `yk`: copy current value, path, or key in JSON detail mode
- `?`: help
- `q`: quit

## Query language

Current query support includes:

- equality: `level = "error"`
- substring: `message like "timeout"`
- regex: `message =~ /health/`
- existence: `exists(user.id)`
- membership: `level in ("warn","error")`
- boolean composition: `and`, `or`, `not`

Examples:

```bash
level = "error" and service like "db"
exists(user.id) and level in ("warn","error")
not message =~ /health/
```

## Testing

```bash
bun run typecheck
bun test
bun run test:e2e
bun run build
```

## Examples

See [examples/mixed.log](examples/mixed.log).
