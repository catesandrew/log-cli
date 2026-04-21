import React from "react";
import { Box, Text } from "../ink";
import { formatEntryCountSummary } from "../lib/headerSummary";
import { formatMergedSourceSummary } from "../lib/merge";
import type { SourceState } from "../types";
import { fitInlineParts } from "../lib/layout";

export function Header(props: {
  source: SourceState | undefined;
  activeIndex: number;
  totalSources: number;
  mergedView: boolean;
  mergeIgnored?: boolean;
  columns: number;
  sourceLabels?: string[];
  mergedFilterActive?: boolean;
  mergedQueryActive?: boolean;
  mergedReverseActive?: boolean;
  mergedFollowActive?: boolean;
  visibleEntries?: number;
}): React.ReactNode {
  const source = props.source;
  const countSummary = formatEntryCountSummary({
    totalEntries: source?.entries.length ?? 0,
    visibleEntries: props.visibleEntries ?? source?.entries.length ?? 0,
    jsonCount: source?.jsonCount ?? 0,
    textCount: source?.textCount ?? 0,
    droppedCount: source?.droppedCount ?? 0,
  });
  const summaryLine = props.mergedView
    ? formatMergedSourceSummary(props.sourceLabels ?? [], Math.max(20, props.columns - 2), {
        filterActive: props.mergedFilterActive,
        queryActive: props.mergedQueryActive,
        reverseActive: props.mergedReverseActive,
        followActive: props.mergedFollowActive,
      })
    : source?.spec.label ?? "no source";
  const countLine = fitInlineParts([countSummary], Math.max(20, props.columns - 2));
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text color="cyan">log</Text>
        <Text dimColor>
          {props.mergeIgnored
            ? "merge ignored"
            : props.mergedView
              ? "merged"
              : `tab ${props.activeIndex + 1}/${props.totalSources}`}
        </Text>
      </Box>
      <Text dimColor>{summaryLine}</Text>
      <Text dimColor>{countLine}</Text>
      <Text dimColor>{"-".repeat(Math.max(0, props.columns - 2))}</Text>
    </Box>
  );
}
