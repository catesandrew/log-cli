import { useMemo } from "react";

export function useVirtualWindow<T>(items: T[], selectedIndex: number, visibleCount: number): {
  start: number;
  visible: T[];
} {
  return useMemo(() => {
    const maxStart = Math.max(0, items.length - visibleCount);
    const center = Math.floor(visibleCount / 2);
    let start = selectedIndex - center;
    if (start < 0) start = 0;
    if (start > maxStart) start = maxStart;
    return {
      start,
      visible: items.slice(start, start + visibleCount),
    };
  }, [items, selectedIndex, visibleCount]);
}
