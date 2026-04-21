import React, { useEffect, useMemo } from "react";
import { Box, useApp, useInput } from "../ink";
import { FullscreenLayout } from "../components/FullscreenLayout";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HelpModal } from "../components/HelpModal";
import { FilterBar } from "../components/FilterBar";
import { LogList } from "../components/LogList";
import { DetailPane } from "../components/DetailPane";
import { useAppState, useAppStateStore, useSetAppState } from "../state/AppState";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { useVirtualWindow } from "../hooks/useVirtualWindow";
import { buildFilter } from "../lib/filter";
import { flattenJsonTree } from "../lib/jsonTree";
import { startSourceManager } from "../lib/sourceManager";
import type { JsonTreeRow, LogEntry, SourceState } from "../types";

function getActiveSource(sources: SourceState[], index: number): SourceState | undefined {
  return sources[index];
}

function getVisibleEntries(source: SourceState | undefined): LogEntry[] {
  if (!source) return [];
  const predicate = buildFilter(source.filter);
  const filtered = source.entries.filter(predicate);
  return source.reverse ? [...filtered].reverse() : filtered;
}

export function LogScreen(): React.ReactNode {
  const { exit } = useApp();
  const size = useTerminalSize();
  const store = useAppStateStore();
  const setState = useSetAppState();
  const sources = useAppState(state => state.sources);
  const activeSourceIndex = useAppState(state => state.activeSourceIndex);
  const focusMode = useAppState(state => state.focusMode);
  const detailMode = useAppState(state => state.detailMode);
  const filterDraft = useAppState(state => state.filterDraft);
  const statusLine = useAppState(state => state.statusLine);
  const fps = useAppState(state => state.fps);
  const showHelp = useAppState(state => state.showHelp);
  const config = useAppState(state => state.config);
  const activeSource = getActiveSource(sources, activeSourceIndex);
  const visibleEntries = useMemo(() => getVisibleEntries(activeSource), [activeSource]);
  const selectedIndex = Math.min(activeSource?.selectedIndex ?? 0, Math.max(0, visibleEntries.length - 1));
  const visibleCount = Math.max(8, size.rows - 10);
  const listWidth = Math.max(42, Math.floor(size.columns * 0.52));
  const listColumns = useMemo(() => {
    const timeWidth = 24;
    const levelWidth = 8;
    const gap = 2;
    const messageWidth = Math.max(16, listWidth - timeWidth - levelWidth - gap - 4);
    return config.columns.map(column => {
      if (column.key === "message") {
        return { ...column, width: messageWidth };
      }
      return column;
    });
  }, [config.columns, listWidth]);
  const windowed = useVirtualWindow(visibleEntries, selectedIndex, visibleCount);
  const selectedEntry = visibleEntries[selectedIndex];
  const jsonRows: JsonTreeRow[] = useMemo(() => {
    if (!selectedEntry || selectedEntry.kind !== "json" || detailMode !== "tree") return [];
    return flattenJsonTree(selectedEntry.jsonValue, new Set(activeSource?.expandedPaths ?? ["root"]));
  }, [activeSource?.expandedPaths, detailMode, selectedEntry]);

  useEffect(() => {
    const cleanup = startSourceManager(
      store.getState().sources.map(source => source.spec),
      config,
      {
        onBatch(sourceId, entries, droppedCount) {
          setState(prev => ({
            ...prev,
            lastFlushSize: entries.length,
            sources: prev.sources.map((source, index) => {
              if (source.spec.id !== sourceId) return source;
              const jsonCount = entries.filter(entry => entry.kind === "json").length;
              const textCount = entries.length - jsonCount;
              const updatedSource: SourceState = {
                ...source,
                entries,
                droppedCount,
                jsonCount,
                textCount,
              };

              const filteredLength = getVisibleEntries(updatedSource).length;
              if (updatedSource.follow) {
                updatedSource.selectedIndex = Math.max(0, filteredLength - 1);
              } else {
                updatedSource.selectedIndex = Math.min(
                  updatedSource.selectedIndex,
                  Math.max(0, filteredLength - 1),
                );
              }

              return updatedSource;
            }),
            statusLine: `Flushed ${entries.length} entries from ${sourceId}`,
          }));
        },
        onStatus(message) {
          setState(prev => ({ ...prev, statusLine: message }));
        },
      },
    );

    return cleanup;
  }, [config, setState, store]);

  useInput((input, key) => {
    if (focusMode === "filter") {
      if (key.escape) {
        setState(prev => ({ ...prev, focusMode: "list", filterDraft: "" }));
      }
      return;
    }

    if (input === "q") {
      exit();
      return;
    }

    if (input === "?") {
      setState(prev => ({ ...prev, showHelp: !prev.showHelp }));
      return;
    }

    if (showHelp && (key.escape || input === "?")) {
      setState(prev => ({ ...prev, showHelp: false }));
      return;
    }

    if (input === "R") {
      setState(prev => ({
        ...prev,
        sources: prev.sources.map((source, index) =>
          index === prev.activeSourceIndex ? { ...source, reverse: !source.reverse } : source,
        ),
      }));
      return;
    }

    if (input === "F") {
      setState(prev => ({
        ...prev,
        focusMode: "filter",
        filterDraft: activeSource?.filter ?? "",
      }));
      return;
    }

    if (key.tab && !key.shift) {
      setState(prev => ({
        ...prev,
        activeSourceIndex: (prev.activeSourceIndex + 1) % Math.max(1, prev.sources.length),
      }));
      return;
    }

    if (key.tab && key.shift) {
      setState(prev => ({
        ...prev,
        activeSourceIndex:
          (prev.activeSourceIndex - 1 + Math.max(1, prev.sources.length)) %
          Math.max(1, prev.sources.length),
      }));
      return;
    }

    if (input === "m") {
      setState(prev => ({
        ...prev,
        detailMode: prev.detailMode === "tree" ? "raw" : "tree",
      }));
      return;
    }

    if (key.return) {
      setState(prev => ({
        ...prev,
        focusMode: prev.focusMode === "list" ? "detail" : "list",
      }));
      return;
    }

    if (focusMode === "detail") {
      if (selectedEntry?.kind === "json" && detailMode === "tree") {
        if (key.upArrow || input === "k") {
          setState(prev => updateActiveSource(prev, source => ({
            ...source,
            detailCursor: Math.max(0, source.detailCursor - 1),
          })));
          return;
        }
        if (key.downArrow || input === "j") {
          setState(prev => updateActiveSource(prev, source => ({
            ...source,
            detailCursor: Math.min(Math.max(0, jsonRows.length - 1), source.detailCursor + 1),
          })));
          return;
        }
        if (input === " " || input === "l" || input === "h") {
          const row = jsonRows[activeSource?.detailCursor ?? 0];
          if (!row?.expandable) return;
          setState(prev => updateActiveSource(prev, source => {
            const expanded = new Set(source.expandedPaths);
            if (expanded.has(row.path)) {
              expanded.delete(row.path);
            } else {
              expanded.add(row.path);
            }
            return { ...source, expandedPaths: [...expanded] };
          }));
        }
      }
      if (key.escape) {
        setState(prev => ({ ...prev, focusMode: "list" }));
      }
      return;
    }

    if (input === "g") {
      setState(prev => updateActiveSource(prev, source => ({ ...source, selectedIndex: 0, follow: false })));
      return;
    }

    if (input === "G") {
      setState(prev =>
        updateActiveSource(prev, source => ({
          ...source,
          selectedIndex: Math.max(0, getVisibleEntries(source).length - 1),
          follow: true,
        })),
      );
      return;
    }

    if (key.pageUp) {
      setState(prev =>
        updateActiveSource(prev, source => ({
          ...source,
          selectedIndex: Math.max(0, source.selectedIndex - 10),
          follow: false,
        })),
      );
      return;
    }

    if (key.pageDown) {
      setState(prev =>
        updateActiveSource(prev, source => ({
          ...source,
          selectedIndex: Math.min(
            Math.max(0, getVisibleEntries(source).length - 1),
            source.selectedIndex + 10,
          ),
          follow: source.selectedIndex + 10 >= getVisibleEntries(source).length - 1,
        })),
      );
      return;
    }

    if (key.upArrow || input === "k") {
      setState(prev =>
        updateActiveSource(prev, source => ({
          ...source,
          selectedIndex: Math.max(0, source.selectedIndex - 1),
          follow: false,
        })),
      );
      return;
    }

    if (key.downArrow || input === "j") {
      setState(prev =>
        updateActiveSource(prev, source => {
          const max = Math.max(0, getVisibleEntries(source).length - 1);
          const next = Math.min(max, source.selectedIndex + 1);
          return {
            ...source,
            selectedIndex: next,
            follow: next === max,
          };
        }),
      );
    }
  });

  return (
    <FullscreenLayout
      header={<Header source={activeSource} activeIndex={activeSourceIndex} totalSources={sources.length} />}
      body={
        <Box flexDirection="row">
          <Box width={listWidth} flexDirection="column">
            <LogList
              entries={windowed.visible}
              selectedIndex={selectedIndex}
              startIndex={windowed.start}
              columns={listColumns}
            />
          </Box>
          <Box width={2} />
          <Box flexGrow={1} flexDirection="column">
            {focusMode === "filter" ? (
              <FilterBar
                value={filterDraft}
                onChange={value => setState(prev => ({ ...prev, filterDraft: value }))}
                onSubmit={value =>
                  setState(prev => updateActiveSource(
                    { ...prev, focusMode: "list", filterDraft: "" },
                    source => ({
                      ...source,
                      filter: value,
                      selectedIndex: 0,
                      follow: false,
                    }),
                  ))
                }
              />
            ) : (
              <DetailPane
                entry={selectedEntry}
                detailMode={detailMode}
                jsonRows={jsonRows}
                jsonCursor={activeSource?.detailCursor ?? 0}
              />
            )}
          </Box>
        </Box>
      }
      footer={
        <Footer
          statusLine={statusLine}
          fps={fps}
          follow={activeSource?.follow ?? false}
          reverse={activeSource?.reverse ?? false}
          focusMode={focusMode}
        />
      }
      overlay={showHelp ? <HelpModal /> : undefined}
    />
  );
}

function updateActiveSource(
  state: ReturnType<typeof useAppStateStore>["getState"] extends () => infer T ? T : never,
  updater: (source: SourceState) => SourceState,
) {
  return {
    ...state,
    sources: state.sources.map((source, index) =>
      index === state.activeSourceIndex ? updater(source) : source,
    ),
  };
}
