import React from "react";
import { Box, Text } from "../ink";
import { parseAnsiText } from "../lib/ansi";
import { formatMergedBoundaryLabel, getMergedEntryMeta } from "../lib/merge";
import type { ColumnConfig, LogEntry } from "../types";

function cell(value: string | undefined, width: number): string {
  const text = value ?? "";
  if (text.length >= width) {
    return text.slice(0, Math.max(0, width - 1)) + "…";
  }
  return text.padEnd(width, " ");
}

export function LogList(props: {
  entries: LogEntry[];
  selectedIndex: number;
  startIndex: number;
  columns: ColumnConfig[];
  showSourceLabel: boolean;
  sourceWidth: number;
  formatMessage?: (entry: LogEntry) => string;
}): React.ReactNode {
  const headerLabels = props.columns.map(column => ({
    ...column,
    label:
      column.key === "level"
        ? "LVL"
        : column.key === "message"
          ? "MSG"
          : column.label,
  }));
  return (
    <Box flexDirection="column">
      <Text dimColor wrap="truncate-end">
        {props.showSourceLabel ? `${cell("SOURCE", props.sourceWidth)} ` : ""}
        {headerLabels.map(column => cell(column.label, column.width)).join(" ")}
      </Text>
      {props.entries.map((entry, index) => {
        const absoluteIndex = props.startIndex + index;
        const selected = absoluteIndex === props.selectedIndex;
        const previous = index > 0 ? props.entries[index - 1] : undefined;
        const mergedMeta = props.showSourceLabel ? getMergedEntryMeta(entry, previous) : null;
        const fields: Record<string, string | undefined> = {
          time: entry.timeText,
          level: String(entry.levelNormalized),
          message: props.formatMessage?.(entry) ?? entry.message,
          prefix: entry.prefix,
        };
        const lineText = `${selected ? ">" : " "} ${
          props.showSourceLabel
            ? `${mergedMeta?.sourceChanged ? ">" : "·"}${cell(mergedMeta?.sourceMarker, props.sourceWidth - 1)} `
            : ""
        }${props.columns.map(column => cell(fields[column.key], column.width)).join(" ")}`;
        const ansiSegments = parseAnsiText(lineText);
        return (
          <Box key={entry.id} flexDirection="column">
            {props.showSourceLabel && mergedMeta?.sourceChanged ? (
              <Text dimColor wrap="truncate-end">
                {formatMergedBoundaryLabel(entry)}
              </Text>
            ) : null}
            {selected || ansiSegments.length === 0 ? (
              <Text
                color={selected ? "black" : undefined}
                backgroundColor={selected ? "white" : undefined}
                wrap="truncate-end"
              >
                {selected ? ansiSegments.map(segment => segment.text).join("") || lineText : lineText}
              </Text>
            ) : (
              <Text wrap="truncate-end">
                {ansiSegments.map((segment, segmentIndex) => (
                  <Text
                    key={`${entry.id}-${segmentIndex}`}
                    color={segment.color}
                    bold={segment.bold}
                  >
                    {segment.text}
                  </Text>
                ))}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
