export type HighlightSegment = {
  text: string;
  highlight?: boolean;
};

export function buildHighlightedSegments(text: string, term: string): HighlightSegment[] {
  if (!term) {
    return [{ text }];
  }

  const loweredText = text.toLowerCase();
  const loweredTerm = term.toLowerCase();
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const matchIndex = loweredText.indexOf(loweredTerm, cursor);
    if (matchIndex === -1) {
      segments.push({ text: text.slice(cursor) });
      break;
    }
    if (matchIndex > cursor) {
      segments.push({ text: text.slice(cursor, matchIndex) });
    }
    segments.push({
      text: text.slice(matchIndex, matchIndex + term.length),
      highlight: true,
    });
    cursor = matchIndex + term.length;
  }

  return segments.filter(segment => segment.text.length > 0);
}
