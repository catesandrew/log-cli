import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { AppConfig, NormalizedLevel } from "../types";

const normalizedLevelSchema = z.enum([
  "trace",
  "debug",
  "info",
  "warn",
  "error",
  "fatal",
  "unknown",
]);

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
  mainLineTemplate: z.string().optional(),
  placeholderFormat: z.string().optional(),
  contextPath: z.string().optional(),
  levelMap: z.record(z.string(), normalizedLevelSchema).default({}),
});

export const DEFAULT_CONFIG: AppConfig = configSchema.parse({});

function stripJsonComments(text: string): string {
  return text
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
}

async function readConfigFile(filePath: string): Promise<AppConfig | null> {
  try {
    const text = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(stripJsonComments(text));
    return configSchema.parse(parsed);
  } catch {
    return null;
  }
}

export async function loadConfig(
  cwd: string,
  explicitPath?: string,
): Promise<AppConfig> {
  const candidates = [
    explicitPath,
    path.join(cwd, ".log.jsonc"),
    path.join(process.env.HOME ?? "", ".config", "log", "config.jsonc"),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const loaded = await readConfigFile(candidate);
    if (loaded) {
      return loaded;
    }
  }

  return DEFAULT_CONFIG;
}

export function normalizeMappedLevel(
  levelMap: Record<string, NormalizedLevel>,
  raw: string | number | undefined,
): string | undefined {
  if (raw === undefined) return undefined;
  return levelMap[String(raw)];
}
