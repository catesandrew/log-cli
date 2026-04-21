import { Command } from "commander";
import { createRoot } from "./ink";
import { getRenderContext, renderAndRun, exitWithMessage } from "./interactiveHelpers";
import { launchRepl } from "./replLauncher";
import { parseTopLevelArgs } from "./lib/argv";
import { loadConfig } from "./lib/config";
import { resolveSources, validateSources } from "./lib/sources";
import { getDefaultAppState } from "./state/AppStateStore";
import { startSourceManager } from "./lib/sourceManager";
import { buildFilteredSummary, buildSummary } from "./lib/summary";
import type { LogEntry } from "./types";

type CliOptions = {
  url?: string;
  cmd?: string;
  max?: string;
  batchMs?: string;
  merge?: boolean;
  filter?: string;
  query?: string;
  reverse?: boolean;
  noFollow?: boolean;
  summaryJson?: boolean;
  summaryText?: boolean;
};

async function runSummary(options: CliOptions, fileArgs: string[]): Promise<void> {
  const config = await loadConfig(process.cwd());
  const follow = options.noFollow === false ? false : true;
  const sources = resolveSources({ files: fileArgs, url: options.url, cmd: options.cmd });
  const error = validateSources(sources);
  if (error) {
    throw await exitWithMessage(error);
  }

  const entriesBySource = new Map<string, LogEntry[]>();
  for (const source of sources) {
    entriesBySource.set(source.id, []);
  }

  await new Promise<void>(resolve => {
    const cleanup = startSourceManager(sources, {
      ...config,
      maxEntries: Number(options.max ?? config.maxEntries),
      batchMs: Number(options.batchMs ?? config.batchMs),
    }, {
      onBatch(sourceId, entries) {
        entriesBySource.set(sourceId, entries);
      },
      onStatus() {},
    });

    setTimeout(() => {
      cleanup();
      resolve();
    }, 300);
  });

  const summary = options.filter || options.query
    ? buildFilteredSummary(
        sources,
        entriesBySource,
        options.filter ?? "",
        options.query ?? "",
        {
          mergedRequested: Boolean(options.merge),
          mergedActive: Boolean(options.merge && sources.length > 1),
          reverse: Boolean(options.reverse),
          follow,
          ...(options.filter ? { filter: options.filter } : {}),
          ...(options.query ? { query: options.query } : {}),
        },
      )
    : buildSummary(sources, entriesBySource, {
        mergedRequested: Boolean(options.merge),
        mergedActive: Boolean(options.merge && sources.length > 1),
        reverse: Boolean(options.reverse),
        follow,
        ...(options.filter ? { filter: options.filter } : {}),
        ...(options.query ? { query: options.query } : {}),
      });
  if (options.summaryJson) {
    process.stdout.write(JSON.stringify(summary, null, 2) + "\n");
  } else {
    process.stdout.write(
      `entries=${summary.totalEntries} json=${summary.sources.reduce((sum, s) => sum + s.json, 0)} text=${summary.sources.reduce((sum, s) => sum + s.text, 0)}\n`,
    );
  }
}

export async function main(): Promise<void> {
  const program = new Command("log");
  program
    .argument("[files...]", "Log files to open")
    .option("--url <url>", "Read lines from a streaming HTTP GET response")
    .option("--cmd <command>", "Spawn a command and read stdout/stderr as lines")
    .option("--max <n>", "Maximum entries per source", "50000")
    .option("--batch-ms <n>", "Batch interval for UI flushes", "50")
    .option("--merge", "Start the interactive TUI with merged multi-source view enabled (ignored with one source)")
    .option("--filter <expr>", "Apply a startup filter expression")
    .option("--query <expr>", "Apply a startup boolean query")
    .option("--reverse", "Start with reverse ordering enabled")
    .option("--no-follow", "Start with follow mode disabled")
    .option("--summary-json", "Read input and output a JSON summary instead of starting the TUI")
    .option("--summary-text", "Read input and output a text summary instead of starting the TUI")
    .helpOption("-h, --help", "Display help");

  const rawArgs = process.argv.slice(2);
  const normalizedInput = rawArgs[0] === "--" ? rawArgs.slice(1) : rawArgs;
  if (normalizedInput.includes("--help") || normalizedInput.includes("-h")) {
    await program.parseAsync(process.argv);
    return;
  }

  const parsed = parseTopLevelArgs(normalizedInput);
  const options = parsed.options as CliOptions;
  const fileArgs = parsed.files;
  const follow = options.noFollow === false ? false : true;

  if (options.summaryJson || options.summaryText || !process.stdout.isTTY) {
    await runSummary(options, fileArgs);
    return;
  }

  const config = await loadConfig(process.cwd());
  const sources = resolveSources({ files: fileArgs, url: options.url, cmd: options.cmd });
  const error = validateSources(sources);
  if (error) {
    throw await exitWithMessage(error);
  }

  const root = await createRoot(getRenderContext().renderOptions);
  await launchRepl(
    root,
    {
      initialState: getDefaultAppState(
        sources,
        {
          ...config,
          maxEntries: Number(options.max ?? config.maxEntries),
          batchMs: Number(options.batchMs ?? config.batchMs),
        },
        {
          mergedView: Boolean(options.merge),
          defaultFilter: options.filter,
          defaultQuery: options.query,
          reverse: Boolean(options.reverse),
          follow,
        },
      ),
    },
    renderAndRun,
  );
}
