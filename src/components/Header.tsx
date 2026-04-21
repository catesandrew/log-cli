import React from "react";
import { Box, Text } from "../ink";
import type { SourceState } from "../types";
import { fitInlineParts } from "../lib/layout";

export function Header(props: {
  source: SourceState | undefined;
  activeIndex: number;
  totalSources: number;
  mergedView: boolean;
  columns: number;
}): React.ReactNode {
  const source = props.source;
  const sourceLine = fitInlineParts(
    [
      (props.mergedView ? "all sources" : source?.spec.label) ?? "no source",
      `entries=${source?.entries.length ?? 0}`,
      `json=${source?.jsonCount ?? 0}`,
      `text=${source?.textCount ?? 0}`,
      `dropped=${source?.droppedCount ?? 0}`,
    ],
    Math.max(20, props.columns - 2),
  );
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text color="cyan">log</Text>
        <Text dimColor>
          {props.mergedView ? "merged" : `tab ${props.activeIndex + 1}/${props.totalSources}`}
        </Text>
      </Box>
      <Text dimColor>{sourceLine}</Text>
      <Text dimColor>{"-".repeat(Math.max(0, props.columns - 2))}</Text>
    </Box>
  );
}
