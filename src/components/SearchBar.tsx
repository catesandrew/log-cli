import React from "react";
import TextInput from "ink-text-input";
import { Box, Text } from "../ink";

export function SearchBar(props: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}): React.ReactNode {
  return (
    <Box flexDirection="column">
      <Text color="magenta">Search mode</Text>
      <Text dimColor>Searches the current detail pane. Enter applies, n/N move through matches.</Text>
      <Box>
        <Text>search&gt; </Text>
        <TextInput value={props.value} onChange={props.onChange} onSubmit={props.onSubmit} />
      </Box>
    </Box>
  );
}
