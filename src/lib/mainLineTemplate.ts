import Handlebars from "handlebars";
import type { AppConfig, LogEntry, NormalizedLevel } from "../types";

function padOrTrim(value: string, width: number): string {
  if (value.length >= width) {
    return value.slice(0, Math.max(0, width));
  }
  return value.padEnd(width, " ");
}

function maybeColor(open: string, close: string, value: string, enabled: boolean): string {
  return enabled ? `${open}${value}${close}` : value;
}

function createTemplateRuntime(noColor: boolean) {
  const runtime = Handlebars.create();
  const colorEnabled = !noColor;

  runtime.registerHelper("bold", (value: unknown) =>
    maybeColor("\u001b[1m", "\u001b[22m", String(value ?? ""), colorEnabled),
  );
  runtime.registerHelper("red", (value: unknown) =>
    maybeColor("\u001b[31m", "\u001b[39m", String(value ?? ""), colorEnabled),
  );
  runtime.registerHelper("yellow", (value: unknown) =>
    maybeColor("\u001b[33m", "\u001b[39m", String(value ?? ""), colorEnabled),
  );
  runtime.registerHelper("green", (value: unknown) =>
    maybeColor("\u001b[32m", "\u001b[39m", String(value ?? ""), colorEnabled),
  );
  runtime.registerHelper("cyan", (value: unknown) =>
    maybeColor("\u001b[36m", "\u001b[39m", String(value ?? ""), colorEnabled),
  );
  runtime.registerHelper("blue", (value: unknown) =>
    maybeColor("\u001b[34m", "\u001b[39m", String(value ?? ""), colorEnabled),
  );
  runtime.registerHelper("purple", (value: unknown) =>
    maybeColor("\u001b[35m", "\u001b[39m", String(value ?? ""), colorEnabled),
  );
  runtime.registerHelper("uppercase", (value: unknown) => String(value ?? "").toUpperCase());
  runtime.registerHelper("fixed_size", (value: unknown, width: unknown) =>
    padOrTrim(String(value ?? ""), Number(width ?? 0)),
  );
  runtime.registerHelper("min_size", (value: unknown, width: unknown) => {
    const text = String(value ?? "");
    const target = Number(width ?? 0);
    return text.length >= target ? text : text.padEnd(target, " ");
  });
  runtime.registerHelper("level_style", (value: unknown) => {
    const text = String(value ?? "");
    const normalized = text.toLowerCase() as NormalizedLevel;
    switch (normalized) {
      case "trace":
        return maybeColor("\u001b[34m", "\u001b[39m", text, colorEnabled);
      case "debug":
        return maybeColor("\u001b[36m", "\u001b[39m", text, colorEnabled);
      case "info":
        return maybeColor("\u001b[32m", "\u001b[39m", text, colorEnabled);
      case "warn":
        return maybeColor("\u001b[33m", "\u001b[39m", text, colorEnabled);
      case "error":
      case "fatal":
        return maybeColor("\u001b[31m", "\u001b[39m", text, colorEnabled);
      default:
        return text;
    }
  });

  return runtime;
}

const runtimeCache = new Map<string, ReturnType<typeof Handlebars.create>>();
const templateCache = new Map<string, (context: unknown) => string>();

function getCompiledTemplate(
  template: string,
  noColor: boolean,
): (context: unknown) => string {
  const cacheKey = `${noColor ? "no-color" : "color"}:${template}`;
  const existing = templateCache.get(cacheKey);
  if (existing) {
    return existing;
  }

  const runtimeKey = noColor ? "no-color" : "color";
  let runtime = runtimeCache.get(runtimeKey);
  if (!runtime) {
    runtime = createTemplateRuntime(noColor);
    runtimeCache.set(runtimeKey, runtime);
  }

  const compiled = runtime.compile(template);
  templateCache.set(cacheKey, compiled);
  return compiled;
}

export function renderMainLine(entry: LogEntry, config: AppConfig): string {
  if (!config.mainLineTemplate) {
    return entry.message;
  }

  const compiled = getCompiledTemplate(
    config.mainLineTemplate,
    Boolean(process.env.NO_COLOR),
  );

  return compiled({
    timestamp: entry.timeText ?? "",
    level: entry.levelNormalized,
    message: entry.message,
    prefix: entry.prefix ?? "",
    json: entry.jsonValue ?? null,
    raw: entry.raw,
  });
}
