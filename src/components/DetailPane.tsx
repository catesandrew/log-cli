import React from "react";
import { Box, Text } from "../ink";
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
}): React.ReactNode {
  if (!props.entry) {
    return <Text dimColor>No entry selected</Text>;
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan">
        {props.entry.kind === "json" ? "JSON detail" : "Text detail"} · mode:{props.detailMode}
      </Text>
      <Text dimColor>
        {props.mergedView && props.entry.sourceLabel ? `${props.entry.sourceLabel} · ` : ""}
        {props.entry.prefix ? `${props.entry.prefix} · ` : ""}
        {props.entry.timeText ?? "no-time"} · {String(props.entry.levelNormalized)}
      </Text>
      {props.searchTerm ? (
        <Text dimColor>
          search: {props.searchTerm} · matches: {props.searchMatches.length}
        </Text>
      ) : null}
      <Box marginTop={1} flexDirection="column">
        {props.entry.kind === "json" && props.detailMode === "tree" ? (
          <JsonTree rows={props.jsonRows} cursor={props.jsonCursor} />
        ) : (
          <TextDetail text={props.entry.raw} />
        )}
      </Box>
    </Box>
  );
}
