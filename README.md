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
- Ring buffer with configurable max size
- Batched ingest updates for fast streams
- Reverse ordering toggle
- Filter mode
- Help modal
- Summary JSON / text mode for automation and smoke testing

## Run

```bash
bun install
bun run src/cli.ts examples/mixed.log
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
- `Tab`: next source tab
- `Shift+Tab`: previous source tab
- `m`: toggle detail mode (`tree` / `raw`)
- `?`: help
- `q`: quit

## Testing

```bash
bun run typecheck
bun test
bun run test:e2e
bun run build
```

## Examples

See [examples/mixed.log](examples/mixed.log).
