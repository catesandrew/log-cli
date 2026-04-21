import React from "react";
import { Box, Text } from "../ink";
import { trimLineForPane } from "../lib/layout";
import { buildTextDetailView } from "../lib/detailText";
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
  detailCursor: number;
  mergedView: boolean;
  paneWidth?: number;
  paneHeight?: number;
}): React.ReactNode {
  if (!props.entry) {
    return <Text dimColor>No entry selected</Text>;
  }

  const width = Math.max(24, props.paneWidth ?? 40);
  const headerLineCount = props.searchTerm ? 3 : 2;
  const contentMaxLines = Math.max(3, (props.paneHeight ?? 10) - headerLineCount);
  const textView = buildTextDetailView({
    text: props.entry.raw,
    width: Math.max(16, width - 1),
    maxLines: contentMaxLines,
    focusLine: props.searchTerm ? props.detailCursor : 0,
    matches: props.searchMatches,
  });
  const detailWindowLabel =
    textView.hiddenAbove > 0 || textView.hiddenBelow > 0
      ? `lines:${textView.visibleStartLine + 1}-${textView.visibleEndLine + 1}/${textView.totalLines}`
      : undefined;
  const searchLabel = props.searchTerm
    ? `search:${props.searchTerm} · matches:${props.searchMatches.length}${detailWindowLabel ? ` · ${detailWindowLabel}` : ""}`
    : detailWindowLabel;

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
      {searchLabel ? (
        <Text dimColor>{trimLineForPane(searchLabel, width)}</Text>
      ) : null}
      <Box flexDirection="column">
        {props.entry.kind === "json" && props.detailMode === "tree" ? (
          <JsonTree rows={props.jsonRows} cursor={props.jsonCursor} />
        ) : (
          <TextDetail view={textView} searchTerm={props.searchTerm} />
        )}
      </Box>
    </Box>
  );
}
