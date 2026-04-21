import { Command } from "commander";
import { createRoot } from "./ink";
import { getRenderContext, renderAndRun, exitWithMessage } from "./interactiveHelpers";
import { launchRepl } from "./replLauncher";
import { loadConfig } from "./lib/config";
import { resolveSources, validateSources } from "./lib/sources";
import { getDefaultAppState } from "./state/AppStateStore";
import { startSourceManager } from "./lib/sourceManager";
import { buildSummary } from "./lib/summary";
import type { LogEntry } from "./types";

type CliOptions = {
  url?: string;
  cmd?: string;
  max?: string;
  batchMs?: string;
  summaryJson?: boolean;
  summaryText?: boolean;
};

async function runSummary(options: CliOptions, fileArgs: string[]): Promise<void> {
  const config = await loadConfig(process.cwd());
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

  const summary = buildSummary(sources, entriesBySource);
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
    .option("--summary-json", "Read input and output a JSON summary instead of starting the TUI")
    .option("--summary-text", "Read input and output a text summary instead of starting the TUI")
    .helpOption("-h, --help", "Display help");

  await program.parseAsync(process.argv);
  const options = program.opts<CliOptions>();
  const fileArgs = (program.args as string[]) ?? [];

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
      ),
    },
    renderAndRun,
  );
}
