import React from "react";
import { Box, Text } from "../ink";
import { trimLineForPane } from "../lib/layout";
import type { DetailMode, JsonTreeRow, LogEntry } from "../types";
import { JsonTree } from "./JsonTree";
import { TextDetail } from "./TextDetail";

export function DetailPane(props: {
  entry: LogEntry | undefined;
  detailMode: DetailMode;
  jsonRows: JsonTreeRow[];
  jsonCursor: number;
  searchTerm: string;
  searchMatches: number[];
  mergedView: boolean;
  paneWidth?: number;
}): React.ReactNode {
  if (!props.entry) {
    return <Text dimColor>No entry selected</Text>;
  }

  const width = Math.max(24, props.paneWidth ?? 40);

  return (
    <Box flexDirection="column">
      <Text color="cyan">
        {trimLineForPane(
          `${props.entry.kind === "json" ? "JSON detail" : "Text detail"} · mode:${props.detailMode}`,
          width,
        )}
      </Text>
      <Text dimColor>
        {trimLineForPane(
          `${props.mergedView && props.entry.sourceLabel ? `${props.entry.sourceLabel} · ` : ""}${props.entry.prefix ? `${props.entry.prefix} · ` : ""}${props.entry.timeText ?? "no-time"} · ${String(props.entry.levelNormalized)}`,
          width,
        )}
      </Text>
      <Text dimColor>
        {trimLineForPane(
          props.searchTerm
            ? `search:${props.searchTerm} · matches:${props.searchMatches.length}`
            : "search:off",
          width,
        )}
      </Text>
      <Box marginTop={1} flexDirection="column">
        {props.entry.kind === "json" && props.detailMode === "tree" ? (
          <JsonTree rows={props.jsonRows} cursor={props.jsonCursor} />
        ) : (
          <TextDetail text={props.entry.raw} searchTerm={props.searchTerm} />
        )}
      </Box>
    </Box>
  );
}
