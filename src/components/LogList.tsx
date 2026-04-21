import React from "react";
import { Box, Text } from "../ink";
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
        const fields: Record<string, string | undefined> = {
          time: entry.timeText,
          level: String(entry.levelNormalized),
          message: entry.message,
          prefix: entry.prefix,
        };
        return (
          <Text
            key={entry.id}
            color={selected ? "black" : undefined}
            backgroundColor={selected ? "white" : undefined}
            wrap="truncate-end"
          >
            {selected ? ">" : " "}{" "}
            {props.showSourceLabel ? `${cell(entry.sourceLabel, props.sourceWidth)} ` : ""}
            {props.columns.map(column => cell(fields[column.key], column.width)).join(" ")}
          </Text>
        );
      })}
    </Box>
  );
}
