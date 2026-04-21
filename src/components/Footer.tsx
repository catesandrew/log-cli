import React from "react";
import { Box, Text } from "../ink";
import { abbreviateStateValue, fitInlineParts } from "../lib/layout";

export function Footer(props: {
  statusLine: string;
  startupStatus: string;
  fps: number;
  follow: boolean;
  reverse: boolean;
  focusMode: string;
  query: string;
  search: string;
  mergedView: boolean;
  mergeIgnored: boolean;
  sourceCount: number;
  mergedFilter: string;
  mergedQuery: string;
  columns: number;
}): React.ReactNode {
  const primaryStatus = props.statusLine;
  const secondaryStatus = props.statusLine === props.startupStatus ? undefined : props.startupStatus;
  const stateLine = fitInlineParts(
    [
      `focus:${props.focusMode}`,
      `follow:${props.follow ? "on" : "off"}`,
      `reverse:${props.reverse ? "on" : "off"}`,
      `merged:${props.mergedView ? "on" : "off"}`,
      ...(props.mergeIgnored ? ["merge:ignored"] : []),
      ...(props.mergedView ? [`srcs:${props.sourceCount}`] : []),
      ...(props.mergedView && props.mergedFilter ? [abbreviateStateValue("mflt", props.mergedFilter, 16)] : []),
      ...(props.mergedView && props.mergedQuery ? [abbreviateStateValue("mqry", props.mergedQuery, 20)] : []),
      ...(!props.mergedView ? [`query:${props.query ? "on" : "off"}`] : []),
      `srch:${props.search ? "on" : "off"}`,
      `fps:${props.fps}`,
    ],
    Math.max(24, props.columns - 2),
  );
  const keyLineOne = fitInlineParts(
    ["j/k move", "Enter detail", "F filter", "Q query", "/ search", "Space fold"],
    Math.max(24, props.columns - 2),
  );
  const keyLineTwo = fitInlineParts(
    [
      "Tab src",
      "Right/Ctrl+Y accept",
      ...(props.mergeIgnored ? ["M merge unavailable"] : ["M merged"]),
      "yy/yp/yk yank",
      "? help",
      "q quit",
    ],
    Math.max(24, props.columns - 2),
  );
  return (
    <Box flexDirection="column">
      <Text dimColor>{"-".repeat(Math.max(0, props.columns - 2))}</Text>
      <Text>{primaryStatus}</Text>
      {secondaryStatus ? <Text dimColor>{secondaryStatus}</Text> : null}
      <Text dimColor>{stateLine}</Text>
      <Text dimColor>{keyLineOne}</Text>
      <Text dimColor>{keyLineTwo}</Text>
    </Box>
  );
}
