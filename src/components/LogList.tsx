import React from "react";
import { Box, Text } from "../ink";
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
          message: entry.message,
          prefix: entry.prefix,
        };
        return (
          <Box key={entry.id} flexDirection="column">
            {props.showSourceLabel && mergedMeta?.sourceChanged ? (
              <Text dimColor wrap="truncate-end">
                {formatMergedBoundaryLabel(entry)}
              </Text>
            ) : null}
            <Text
              color={selected ? "black" : undefined}
              backgroundColor={selected ? "white" : undefined}
              wrap="truncate-end"
            >
              {selected ? ">" : " "}{" "}
              {props.showSourceLabel
                ? `${mergedMeta?.sourceChanged ? ">" : "·"}${cell(mergedMeta?.sourceMarker, props.sourceWidth - 1)} `
                : ""}
              {props.columns.map(column => cell(fields[column.key], column.width)).join(" ")}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
