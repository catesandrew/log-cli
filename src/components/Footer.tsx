import React from "react";
import { Box, Text } from "../ink";
import { fitInlineParts } from "../lib/layout";

export function Footer(props: {
  statusLine: string;
  fps: number;
  follow: boolean;
  reverse: boolean;
  focusMode: string;
  query: string;
  search: string;
  mergedView: boolean;
  columns: number;
}): React.ReactNode {
  const stateLine = fitInlineParts(
    [
      `focus:${props.focusMode}`,
      `follow:${props.follow ? "on" : "off"}`,
      `reverse:${props.reverse ? "on" : "off"}`,
      `merged:${props.mergedView ? "on" : "off"}`,
      `query:${props.query ? "on" : "off"}`,
      `search:${props.search ? "on" : "off"}`,
      `fps:${props.fps}`,
    ],
    Math.max(24, props.columns - 2),
  );
  const keyLineOne = fitInlineParts(
    ["j/k move", "Enter detail", "F filter", "Q query", "/ search", "Space fold"],
    Math.max(24, props.columns - 2),
  );
  const keyLineTwo = fitInlineParts(
    ["Tab src", "Right/Ctrl+Y accept", "M merged", "yy/yp/yk yank", "? help", "q quit"],
    Math.max(24, props.columns - 2),
  );
  return (
    <Box flexDirection="column">
      <Text dimColor>{"-".repeat(Math.max(0, props.columns - 2))}</Text>
      <Text>{props.statusLine}</Text>
      <Text dimColor>{stateLine}</Text>
      <Text dimColor>{keyLineOne}</Text>
      <Text dimColor>{keyLineTwo}</Text>
    </Box>
  );
}
