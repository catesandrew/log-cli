import React from "react";
import { Box, Text } from "../ink";
import { parseAnsiText } from "../lib/ansi";
import { buildTextDetailLines } from "../lib/detailText";
import { buildHighlightedSegments } from "../lib/textHighlight";

export function TextDetail(props: { text: string; searchTerm?: string; width?: number; maxLines?: number }): React.ReactNode {
  const width = Math.max(16, props.width ?? 40);
  const lines = buildTextDetailLines(props.text, width, props.maxLines);
  if (lines.length > 1) {
    return (
      <Box flexDirection="column">
        {lines.map((line, index) => (
          <TextDetail
            key={`${line}-${index}`}
            text={line}
            searchTerm={props.searchTerm}
            width={width}
          />
        ))}
      </Box>
    );
  }

  const displayText = lines[0] ?? "";
  const segments = parseAnsiText(displayText);
  if (segments.length === 0) {
    return <PlainText text={displayText} searchTerm={props.searchTerm} />;
  }

  return (
    <AnsiText segments={segments} searchTerm={props.searchTerm} />
  );
}

function PlainText(props: { text: string; searchTerm?: string }): React.ReactNode {
  const segments = buildHighlightedSegments(props.text, props.searchTerm ?? "");
  return (
    <Text wrap="wrap">
      {segments.map((segment, index) => (
        <Text
          key={`${segment.text}-${index}`}
          backgroundColor={segment.highlight ? "yellow" : undefined}
          color={segment.highlight ? "black" : undefined}
        >
          {segment.text}
        </Text>
      ))}
    </Text>
  );
}

function AnsiText(props: { segments: ReturnType<typeof parseAnsiText>; searchTerm?: string }): React.ReactNode {
  return (
    <Text wrap="wrap">
      {props.segments.flatMap((segment, index) =>
        buildHighlightedSegments(segment.text, props.searchTerm ?? "").map((piece, pieceIndex) => (
          <Text
            key={`${segment.text}-${index}-${pieceIndex}`}
            color={piece.highlight ? "black" : segment.color}
            backgroundColor={piece.highlight ? "yellow" : undefined}
            bold={segment.bold}
          >
            {piece.text}
          </Text>
        )),
      )}
    </Text>
  );
}
