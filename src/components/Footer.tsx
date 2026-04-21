import React from "react";
import { Box, Text } from "../ink";

export function Footer(props: {
  statusLine: string;
  fps: number;
  follow: boolean;
  reverse: boolean;
  focusMode: string;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text dimColor>{"-".repeat(Math.max(0, (process.stdout.columns ?? 100) - 2))}</Text>
      <Text>{props.statusLine}</Text>
      <Text dimColor>
        focus:{props.focusMode} · follow:{props.follow ? "on" : "off"} · reverse:
        {props.reverse ? "on" : "off"} · fps:{props.fps} · j/k move · Enter detail · F filter ·
        Space fold · Tab next source · ? help · q quit
      </Text>
    </Box>
  );
}
