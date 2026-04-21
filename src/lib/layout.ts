export function computePaneWidths(columns: number): {
  listWidth: number;
  detailWidth: number;
  gap: number;
} {
  const gap = columns >= 100 ? 3 : 2;
  const listWidth = Math.max(40, Math.min(Math.floor(columns * (columns >= 120 ? 0.5 : 0.46)), columns - 28));
  const detailWidth = Math.max(24, columns - listWidth - gap);
  return {
    listWidth,
    detailWidth,
    gap,
  };
}

export function fitInlineParts(parts: string[], maxWidth: number): string {
  const separator = " · ";
  let line = "";
  for (const part of parts) {
    const candidate = line ? `${line}${separator}${part}` : part;
    if (candidate.length <= maxWidth) {
      line = candidate;
      continue;
    }
    if (!line) {
      return part.slice(0, Math.max(0, maxWidth - 1)) + (part.length > maxWidth ? "…" : "");
    }
    break;
  }
  return line;
}

export function trimLineForPane(text: string, maxWidth: number): string {
  if (text.length <= maxWidth) {
    return text;
  }
  if (maxWidth <= 1) {
    return "…";
  }
  return `${text.slice(0, Math.max(0, maxWidth - 1))}…`;
}
