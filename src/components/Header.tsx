import React from "react";
import { Box, Text } from "../ink";
import type { SourceState } from "../types";

export function Header(props: {
  source: SourceState | undefined;
  activeIndex: number;
  totalSources: number;
  mergedView: boolean;
}): React.ReactNode {
  const source = props.source;
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text color="cyan">log</Text>
        <Text dimColor>
          {props.mergedView ? "merged" : `tab ${props.activeIndex + 1}/${props.totalSources}`}
        </Text>
      </Box>
      <Box justifyContent="space-between">
        <Text dimColor>{(props.mergedView ? "all sources" : source?.spec.label) ?? "no source"}</Text>
        <Text dimColor>entries={source?.entries.length ?? 0}</Text>
      </Box>
      <Box justifyContent="space-between">
        <Text dimColor>json={source?.jsonCount ?? 0} · text={source?.textCount ?? 0}</Text>
        <Text dimColor>dropped={source?.droppedCount ?? 0}</Text>
      </Box>
      <Text dimColor>{"-".repeat(Math.max(0, (process.stdout.columns ?? 100) - 2))}</Text>
    </Box>
  );
}
