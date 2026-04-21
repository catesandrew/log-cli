import React from "react";
import TextInput from "ink-text-input";
import { Box, Text } from "../ink";

export function QueryBar(props: {
  value: string;
  suggestions: string[];
  selectedSuggestionIndex: number;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
}): React.ReactNode {
  const visibleSuggestions = props.suggestions.slice(0, 5);
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
      <Text dimColor>Tab/Shift+Tab cycles suggestions. Enter applies current query.</Text>
      <Box flexDirection="column">
        {visibleSuggestions.map((item, index) => (
          <Text
            key={item}
            dimColor={index !== props.selectedSuggestionIndex}
            color={index === props.selectedSuggestionIndex ? "cyan" : undefined}
          >
            {index === props.selectedSuggestionIndex ? ">" : " "} {item}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
