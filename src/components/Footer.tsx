import React from "react";
import { Box, Text } from "../ink";

export function Footer(props: {
  statusLine: string;
  fps: number;
  follow: boolean;
  reverse: boolean;
  focusMode: string;
  query: string;
  search: string;
  mergedView: boolean;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text dimColor>{"-".repeat(Math.max(0, (process.stdout.columns ?? 100) - 2))}</Text>
      <Text>{props.statusLine}</Text>
      <Text dimColor>
        focus:{props.focusMode} · follow:{props.follow ? "on" : "off"} · reverse:
        {props.reverse ? "on" : "off"}
      </Text>
      <Text dimColor>
        merged:{props.mergedView ? "on" : "off"} · query:{props.query ? "on" : "off"} ·
        search:{props.search ? "on" : "off"} · fps:{props.fps}
      </Text>
      <Text dimColor>
        j/k move · Enter detail · F filter · Q query · / search · Space fold
      </Text>
      <Text dimColor>
        Tab source · RightArrow/Ctrl+Y accept hint · M merged · yy/yp/yk yank · ? help · q quit
      </Text>
    </Box>
  );
}
