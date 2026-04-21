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
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text dimColor>
        {props.showSourceLabel ? `${cell("SOURCE", 16)} ` : ""}
        {props.columns.map(column => cell(column.label, column.width)).join(" ")}
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
          >
            {selected ? ">" : " "}{" "}
            {props.showSourceLabel ? `${cell(entry.sourceLabel, 16)} ` : ""}
            {props.columns.map(column => cell(fields[column.key], column.width)).join(" ")}
          </Text>
        );
      })}
    </Box>
  );
}
