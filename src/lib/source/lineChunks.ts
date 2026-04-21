export function splitChunkBuffer(
  buffer: string,
  chunk: string,
): { lines: string[]; rest: string } {
  const combined = buffer + chunk;
  const parts = combined.split(/\r?\n/);
  const rest = parts.pop() ?? "";
  return {
    lines: parts.filter(line => line.length > 0),
    rest,
  };
}
