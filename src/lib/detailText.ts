import { parseAnsiText } from "./ansi";
import type { AnsiSegment } from "../types";

export type TextDetailLine = {
  lineNumber: number;
  segments: AnsiSegment[];
  isMatch: boolean;
  isCurrent: boolean;
};

export type TextDetailView = {
  lines: TextDetailLine[];
  totalLines: number;
  visibleStartLine: number;
  visibleEndLine: number;
  hiddenAbove: number;
  hiddenBelow: number;
};

function trimAnsiSegments(segments: AnsiSegment[], maxWidth: number): AnsiSegment[] {
  const visibleLength = segments.reduce((sum, segment) => sum + segment.text.length, 0);
  if (visibleLength <= maxWidth) {
    return segments;
  }
  if (maxWidth <= 1) {
    return [{ text: "…" }];
  }

  const trimmed: AnsiSegment[] = [];
  let remaining = maxWidth - 1;
  for (const segment of segments) {
    if (remaining <= 0) {
      break;
    }
    if (segment.text.length <= remaining) {
      trimmed.push(segment);
      remaining -= segment.text.length;
      continue;
    }
    trimmed.push({
      ...segment,
      text: segment.text.slice(0, remaining).replace(/\s+$/u, ""),
    });
    remaining = 0;
  }

  trimmed.push({ text: "…" });
  return trimmed.filter(segment => segment.text.length > 0);
}

export function buildTextDetailView(input: {
  text: string;
  width: number;
  maxLines: number;
  focusLine?: number;
  matches?: number[];
}): TextDetailView {
  const rawLines = input.text.split(/\r?\n/);
  const totalLines = Math.max(1, rawLines.length);
  const maxLines = Math.max(1, input.maxLines);
  const lineNumberWidth = String(totalLines).length;
  const prefixWidth = lineNumberWidth + 2;
  const contentWidth = Math.max(1, input.width - prefixWidth);
  const focusLine = Math.min(
    Math.max(0, input.focusLine ?? 0),
    Math.max(0, totalLines - 1),
  );

  const maxStart = Math.max(0, totalLines - maxLines);
  const visibleStartLine =
    totalLines <= maxLines
      ? 0
      : Math.min(
          maxStart,
          Math.max(0, focusLine - Math.floor(maxLines / 2)),
        );
  const visibleEndLine = Math.min(totalLines - 1, visibleStartLine + maxLines - 1);
  const matchSet = new Set(input.matches ?? []);

  return {
    lines: rawLines
      .slice(visibleStartLine, visibleEndLine + 1)
      .map((line, index) => {
        const lineNumber = visibleStartLine + index;
        return {
          lineNumber,
          segments: trimAnsiSegments(parseAnsiText(line), contentWidth),
          isMatch: matchSet.has(lineNumber),
          isCurrent: lineNumber === focusLine && matchSet.has(lineNumber),
        };
      }),
    totalLines,
    visibleStartLine,
    visibleEndLine,
    hiddenAbove: visibleStartLine,
    hiddenBelow: Math.max(0, totalLines - visibleEndLine - 1),
  };
}
