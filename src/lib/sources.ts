import fs from "node:fs";
import path from "node:path";
import type { SourceSpec } from "../types";
import { createId } from "../utils/id";

export function resolveSources(input: {
  files: string[];
  url?: string;
  cmd?: string;
}): SourceSpec[] {
  const specs: SourceSpec[] = [];
  for (const file of input.files) {
    specs.push({
      id: createId("src"),
      label: path.basename(file),
      kind: "file",
      filePath: file,
    });
  }

  if (input.url) {
    specs.push({
      id: createId("src"),
      label: input.url,
      kind: "url",
      url: input.url,
    });
  }

  if (input.cmd) {
    specs.push({
      id: createId("src"),
      label: input.cmd,
      kind: "cmd",
      command: input.cmd,
    });
  }

  if (specs.length === 0 && !process.stdin.isTTY) {
    specs.push({
      id: createId("src"),
      label: "stdin",
      kind: "stdin",
    });
  }

  return specs;
}

export function validateSources(sources: SourceSpec[]): string | null {
  if (sources.length === 0) {
    return "No input sources provided. Pass files, --url, --cmd, or pipe stdin.";
  }

  for (const source of sources) {
    if (source.kind === "file" && source.filePath && !fs.existsSync(source.filePath)) {
      return `File not found: ${source.filePath}`;
    }
  }

  return null;
}
