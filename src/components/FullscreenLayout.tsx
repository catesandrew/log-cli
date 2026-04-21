import React from "react";
import { Box } from "../ink";

export function FullscreenLayout(props: {
  header: React.ReactNode;
  body: React.ReactNode;
  footer: React.ReactNode;
  overlay?: React.ReactNode;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      {props.header}
      {props.body}
      {props.footer}
      {props.overlay}
    </Box>
  );
}
