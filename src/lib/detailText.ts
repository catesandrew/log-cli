import { trimLineForPane } from "./layout";

export function buildTextDetailLines(
  text: string,
  width: number,
  maxLines?: number,
): string[] {
  const lines = text.split(/\r?\n/).map(line => trimLineForPane(line, width));
  if (!maxLines || lines.length <= maxLines) {
    return lines;
  }

  const visible = lines.slice(0, Math.max(0, maxLines - 1));
  const last = trimLineForPane(lines[maxLines - 1] ?? "", width);
  visible.push(last.endsWith("…") ? last : trimLineForPane(`${last}…`, width));
  return visible;
}
