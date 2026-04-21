import React from "react";
import TextInput from "ink-text-input";
import { Box, Text } from "../ink";

export function QueryBar(props: {
  value: string;
  suggestions: string[];
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text color="cyan">Query mode</Text>
      <Text dimColor>
        Examples: level = "error", exists(user.id), level in ("warn","error"), message =~ /health/
      </Text>
      <Box>
        <Text>query&gt; </Text>
        <TextInput value={props.value} onChange={props.onChange} onSubmit={props.onSubmit} />
      </Box>
      <Text dimColor>Suggestions: {props.suggestions.join(" · ")}</Text>
    </Box>
  );
}
