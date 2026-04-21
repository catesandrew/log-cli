import React from "react";
import { Box, Text } from "../ink";
import type { JsonTreeRow } from "../types";

export function JsonTree(props: {
  rows: JsonTreeRow[];
  cursor: number;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      {props.rows.map((row, index) => {
        const focused = index === props.cursor;
        const indent = "  ".repeat(row.depth);
        const marker = row.expandable ? (row.expanded ? "▾" : "▸") : " ";
        return (
          <Text
            key={row.path}
            color={focused ? "black" : undefined}
            backgroundColor={focused ? "white" : undefined}
          >
            {indent}
            {marker} {row.keyLabel}: {row.valueLabel}
          </Text>
        );
      })}
    </Box>
  );
}
