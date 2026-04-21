import React from "react";
import { Box, Text } from "../ink";
import type { TextDetailView } from "../lib/detailText";
import { buildHighlightedSegments } from "../lib/textHighlight";

export function TextDetail(props: {
  view: TextDetailView;
  searchTerm?: string;
}): React.ReactNode {
  const lineNumberWidth = String(Math.max(1, props.view.totalLines)).length;

  return (
    <Box flexDirection="column">
      {props.view.lines.map(line => {
        const marker = line.isCurrent ? ">" : line.isMatch ? "*" : " ";
        const prefix = `${marker}${String(line.lineNumber + 1).padStart(lineNumberWidth)} `;
        return (
          <Text key={`${line.lineNumber}-${prefix}`} wrap="truncate-end">
            <Text
              dimColor={!line.isCurrent}
              color={line.isCurrent ? "cyan" : undefined}
              bold={line.isCurrent}
            >
              {prefix}
            </Text>
            {line.segments.flatMap((segment, segmentIndex) =>
              buildHighlightedSegments(segment.text, props.searchTerm ?? "").map((piece, pieceIndex) => (
                <Text
                  key={`${line.lineNumber}-${segmentIndex}-${pieceIndex}`}
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
      })}
    </Box>
  );
}
