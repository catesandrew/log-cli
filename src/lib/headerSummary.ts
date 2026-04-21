export function formatEntryCountSummary(input: {
  totalEntries: number;
  visibleEntries: number;
  jsonCount: number;
  textCount: number;
  droppedCount: number;
}): string {
  const countPart =
    input.visibleEntries !== input.totalEntries
      ? `shown=${input.visibleEntries}/${input.totalEntries}`
      : `entries=${input.totalEntries}`;

  return `${countPart} · json=${input.jsonCount} · text=${input.textCount} · dropped=${input.droppedCount}`;
}
