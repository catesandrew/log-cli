import React from "react";
import { Box, Text } from "../ink";
import type { SourceState } from "../types";

export function Header(props: {
  source: SourceState | undefined;
  activeIndex: number;
  totalSources: number;
}): React.ReactNode {
  const source = props.source;
  return (
    <Box flexDirection="column">
      <Box justifyContent="space-between">
        <Text color="cyan">log</Text>
        <Text dimColor>
          tab {props.activeIndex + 1}/{props.totalSources}
        </Text>
      </Box>
      <Text dimColor>
        {source?.spec.label ?? "no source"} · entries={source?.entries.length ?? 0} · json=
        {source?.jsonCount ?? 0} · text={source?.textCount ?? 0} · dropped=
        {source?.droppedCount ?? 0}
      </Text>
      <Text dimColor>{"-".repeat(Math.max(0, (process.stdout.columns ?? 100) - 2))}</Text>
    </Box>
  );
}
