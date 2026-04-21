import React from "react";
import { Text } from "../ink";
import { parseAnsiText } from "../lib/ansi";

export function TextDetail(props: { text: string }): React.ReactNode {
  const segments = parseAnsiText(props.text);
  if (segments.length === 0) {
    return <Text wrap="wrap">{props.text}</Text>;
  }

  return (
    <Text wrap="wrap">
      {segments.map((segment, index) => (
        <Text key={`${segment.text}-${index}`} color={segment.color} bold={segment.bold}>
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}
