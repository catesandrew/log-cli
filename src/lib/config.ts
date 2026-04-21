import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { AppConfig } from "../types";

const configSchema = z.object({
  maxEntries: z.number().int().positive().default(50000),
  batchMs: z.number().int().positive().default(50),
  preserveAnsiText: z.boolean().default(true),
  columns: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        width: z.number().int().positive().default(18),
      }),
    )
    .default([
      { key: "time", label: "TIME", width: 24 },
      { key: "level", label: "LEVEL", width: 8 },
      { key: "message", label: "MESSAGE", width: 60 },
    ]),
});

export const DEFAULT_CONFIG: AppConfig = configSchema.parse({});

function stripJsonComments(text: string): string {
  return text
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

export async function loadConfig(cwd: string): Promise<AppConfig> {
  const candidates = [
    path.join(cwd, ".log.jsonc"),
    path.join(process.env.HOME ?? "", ".log.jsonc"),
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const text = await fs.readFile(candidate, "utf8");
      const parsed = JSON.parse(stripJsonComments(text));
      return configSchema.parse(parsed);
    } catch {
      // ignore and continue
    }
  }

  return DEFAULT_CONFIG;
}
