import React, { useEffect, useMemo, useRef } from "react";
import clipboard from "clipboardy";
import { Box, useApp, useInput } from "../ink";
import { DetailPane } from "../components/DetailPane";
import { FilterBar } from "../components/FilterBar";
import { Footer } from "../components/Footer";
import { FullscreenLayout } from "../components/FullscreenLayout";
import { Header } from "../components/Header";
import { HelpModal } from "../components/HelpModal";
import { LogList } from "../components/LogList";
import { QueryBar } from "../components/QueryBar";
import { SearchBar } from "../components/SearchBar";
import { useTerminalSize } from "../hooks/useTerminalSize";
import { copyCurrentJsonValue, copyCurrentKey, copyCurrentPath, createDetailSearch } from "../lib/detailActions";
import { buildFilter } from "../lib/filter";
import { applyEntryBatch } from "../lib/ingestState";
import { flattenJsonTree } from "../lib/jsonTree";
import { mergeEntriesByTime } from "../lib/merge";
import { buildQuery } from "../lib/query";
import { buildQuerySuggestions } from "../lib/queryAutocomplete";
import { startSourceManager } from "../lib/sourceManager";
import { createTextSearch } from "../lib/textSearch";
import { useAppState, useAppStateStore, useSetAppState } from "../state/AppState";
import type { AppState, JsonTreeRow, LogEntry, SourceState } from "../types";

function getVisibleEntries(source: SourceState | undefined): LogEntry[] {
  if (!source) return [];
  const filter = buildFilter(source.filter);
  const query = buildQuery(source.query);
  const filtered = source.entries.filter(entry => filter(entry) && query(entry));
  return source.reverse ? [...filtered].reverse() : filtered;
}

function getSyntheticMergedSource(sources: SourceState[]): SourceState {
  const seed = sources[0] ?? {
    spec: { id: "merged", label: "all sources", kind: "file" as const },
    entries: [],
    droppedCount: 0,
    jsonCount: 0,
    textCount: 0,
    filter: "",
    query: "",
    follow: true,
    reverse: false,
    selectedIndex: 0,
    expandedPaths: ["root"],
    detailCursor: 0,
  };
  const mergedEntries = mergeEntriesByTime(sources.map(source => source.entries), seed.reverse);
  const jsonCount = mergedEntries.filter(entry => entry.kind === "json").length;
  return {
    ...seed,
    spec: { id: "merged", label: "all sources", kind: "file" },
    entries: mergedEntries,
    droppedCount: sources.reduce((sum, source) => sum + source.droppedCount, 0),
    jsonCount,
    textCount: mergedEntries.length - jsonCount,
  };
}

function updateCurrentSource(state: AppState, updater: (source: SourceState) => SourceState): AppState {
  if (state.sources.length === 0) return state;
  return {
    ...state,
    sources: state.sources.map((source, index) =>
      index === state.activeSourceIndex ? updater(source) : source,
    ),
  };
}

async function copyValue(value: string, setState: ReturnType<typeof useSetAppState>) {
  try {
    await clipboard.write(value);
    setState(prev => ({ ...prev, statusLine: `Copied: ${value}` }));
  } catch (error) {
    setState(prev => ({
      ...prev,
      statusLine: `Clipboard failed: ${error instanceof Error ? error.message : String(error)}`,
    }));
  }
}

export function LogScreen(): React.ReactNode {
  const { exit } = useApp();
  const size = useTerminalSize();
  const store = useAppStateStore();
  const setState = useSetAppState();
  const sources = useAppState(state => state.sources);
  const activeSourceIndex = useAppState(state => state.activeSourceIndex);
  const mergedView = useAppState(state => state.mergedView);
  const focusMode = useAppState(state => state.focusMode);
  const detailMode = useAppState(state => state.detailMode);
  const filterDraft = useAppState(state => state.filterDraft);
  const queryDraft = useAppState(state => state.queryDraft);
  const querySuggestionIndex = useAppState(state => state.querySuggestionIndex);
  const detailSearchDraft = useAppState(state => state.detailSearchDraft);
  const detailSearchTerm = useAppState(state => state.detailSearchTerm);
  const detailSearchMatches = useAppState(state => state.detailSearchMatches);
  const statusLine = useAppState(state => state.statusLine);
  const fps = useAppState(state => state.fps);
  const lastFlushSize = useAppState(state => state.lastFlushSize);
  const showHelp = useAppState(state => state.showHelp);
  const config = useAppState(state => state.config);

  const baseSource = sources[activeSourceIndex];
  const activeSource = useMemo(
    () => (mergedView ? getSyntheticMergedSource(sources) : baseSource),
    [baseSource, mergedView, sources],
  );
  const visibleEntries = useMemo(() => getVisibleEntries(activeSource), [activeSource]);
  const selectedIndex = Math.min(activeSource?.selectedIndex ?? 0, Math.max(0, visibleEntries.length - 1));
  const visibleCount = Math.max(8, size.rows - 12);
  const listWidth = Math.max(46, Math.floor(size.columns * 0.52));
  const listColumns = useMemo(() => {
    const timeWidth = 24;
    const levelWidth = 8;
    const gap = 2;
    const messageWidth = Math.max(20, listWidth - timeWidth - levelWidth - gap - 4);
    return config.columns.map(column =>
      column.key === "message" ? { ...column, width: messageWidth } : column,
    );
  }, [config.columns, listWidth]);
  const start = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCount / 2), Math.max(0, visibleEntries.length - visibleCount)));
  const visibleWindow = visibleEntries.slice(start, start + visibleCount);
  const selectedEntry = visibleEntries[selectedIndex];
  const jsonRows: JsonTreeRow[] = useMemo(() => {
    if (!selectedEntry || selectedEntry.kind !== "json" || detailMode !== "tree") return [];
    return flattenJsonTree(selectedEntry.jsonValue, new Set(activeSource?.expandedPaths ?? ["root"]));
  }, [activeSource?.expandedPaths, detailMode, selectedEntry]);
  const textSearch = useMemo(
    () => createTextSearch(selectedEntry?.raw ?? "", detailSearchTerm),
    [detailSearchTerm, selectedEntry?.raw],
  );
  const detailSearch = useMemo(
    () => createDetailSearch(jsonRows, detailSearchTerm),
    [jsonRows, detailSearchTerm],
  );
  const detailMatches =
    selectedEntry?.kind === "json" && detailMode === "tree"
      ? detailSearch.matches
      : textSearch.matches;
  const querySuggestions = useMemo(
    () => buildQuerySuggestions(activeSource?.entries ?? [], queryDraft),
    [activeSource?.entries, queryDraft],
  );
  const selectedSuggestionIndex = Math.min(
    querySuggestionIndex,
    Math.max(0, querySuggestions.length - 1),
  );
  const renderCountRef = useRef(0);
  const lastPerfRef = useRef({ count: 0, at: Date.now() });
  const pendingYankRef = useRef(false);
  renderCountRef.current += 1;

  useEffect(() => {
    const cleanup = startSourceManager(
      store.getState().sources.map(source => source.spec),
      config,
      {
        onBatch(sourceId, entries, droppedCount) {
          setState(prev => ({
            ...prev,
            lastFlushSize: entries.length,
            sources: prev.sources.map(source => {
              if (source.spec.id !== sourceId) return source;
              const updatedSource = applyEntryBatch(source, entries, prev.config.maxEntries);
              updatedSource.droppedCount = Math.max(updatedSource.droppedCount, droppedCount);
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

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastPerfRef.current.at;
    if (elapsed <= 0) return;
    const rendered = renderCountRef.current - lastPerfRef.current.count;
    const nextFps = rendered > 0 ? Math.round((rendered * 1000) / elapsed) : fps;
    lastPerfRef.current = { count: renderCountRef.current, at: now };
    if (nextFps !== fps && nextFps > 0) {
      setState(prev => ({ ...prev, fps: nextFps }));
    }
  }, [selectedIndex, focusMode, detailMode, detailSearchTerm, lastFlushSize, fps, setState]);

  useEffect(() => {
    setState(prev =>
      prev.detailSearchMatches === detailMatches ? prev : { ...prev, detailSearchMatches: detailMatches },
    );
  }, [detailMatches, setState]);

  useInput((input, key) => {
    if (focusMode === "filter") {
      if (key.escape) {
        setState(prev => ({ ...prev, focusMode: "list", filterDraft: "" }));
      }
      return;
    }

    if (focusMode === "query") {
      if (key.tab) {
        if (querySuggestions.length === 0) return;
        const nextIndex = key.shift
          ? (querySuggestionIndex - 1 + querySuggestions.length) % querySuggestions.length
          : (querySuggestionIndex + 1) % querySuggestions.length;
        setState(prev => ({
          ...prev,
          querySuggestionIndex: nextIndex,
          queryDraft: querySuggestions[nextIndex] ?? prev.queryDraft,
        }));
        return;
      }
      if (key.escape) {
        setState(prev => ({ ...prev, focusMode: "list", queryDraft: "", querySuggestionIndex: 0 }));
      }
      return;
    }

    if (focusMode === "search") {
      if (key.escape) {
        setState(prev => ({ ...prev, focusMode: "detail", detailSearchDraft: "" }));
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
      setState(prev => updateCurrentSource(prev, source => ({ ...source, reverse: !source.reverse })));
      return;
    }

    if (input === "F") {
      setState(prev => ({ ...prev, focusMode: "filter", filterDraft: baseSource?.filter ?? "" }));
      return;
    }

    if (input === "Q") {
      setState(prev => ({
        ...prev,
        focusMode: "query",
        queryDraft: baseSource?.query ?? "",
        querySuggestionIndex: 0,
      }));
      return;
    }

    if (input === "M" && sources.length > 1) {
      setState(prev => ({ ...prev, mergedView: !prev.mergedView, statusLine: !prev.mergedView ? "Merged view enabled" : "Merged view disabled" }));
      return;
    }

    if (input === "/" && focusMode === "detail") {
      setState(prev => ({
        ...prev,
        focusMode: "search",
        detailSearchDraft: prev.detailSearchTerm,
      }));
      return;
    }

    if (key.tab && !key.shift) {
      setState(prev => ({
        ...prev,
        activeSourceIndex: (prev.activeSourceIndex + 1) % Math.max(1, prev.sources.length),
        mergedView: false,
      }));
      return;
    }

    if (key.tab && key.shift) {
      setState(prev => ({
        ...prev,
        activeSourceIndex: (prev.activeSourceIndex - 1 + Math.max(1, prev.sources.length)) % Math.max(1, prev.sources.length),
        mergedView: false,
      }));
      return;
    }

    if (input === "m") {
      setState(prev => ({ ...prev, detailMode: prev.detailMode === "tree" ? "raw" : "tree" }));
      return;
    }

    if (key.return) {
      setState(prev => ({ ...prev, focusMode: prev.focusMode === "list" ? "detail" : "list" }));
      return;
    }

    if (focusMode === "detail") {
      if (pendingYankRef.current) {
        pendingYankRef.current = false;
        const row = jsonRows[activeSource?.detailCursor ?? 0];
        if (!row) return;
        if (input === "y") {
          void copyValue(copyCurrentJsonValue(row), setState);
          return;
        }
        if (input === "p") {
          void copyValue(copyCurrentPath(row), setState);
          return;
        }
        if (input === "k") {
          void copyValue(copyCurrentKey(row), setState);
          return;
        }
      }

        if (selectedEntry?.kind === "json" && detailMode === "tree") {
        if (key.upArrow || input === "k") {
          setState(prev => updateCurrentSource(prev, source => ({ ...source, detailCursor: Math.max(0, source.detailCursor - 1) })));
          return;
        }
        if (key.downArrow || input === "j") {
          setState(prev => updateCurrentSource(prev, source => ({ ...source, detailCursor: Math.min(Math.max(0, jsonRows.length - 1), source.detailCursor + 1) })));
          return;
        }
        if (input === " " || input === "l" || input === "h") {
          const row = jsonRows[activeSource?.detailCursor ?? 0];
          if (!row?.expandable) return;
          setState(prev => updateCurrentSource(prev, source => {
            const expanded = new Set(source.expandedPaths);
            if (expanded.has(row.path)) expanded.delete(row.path); else expanded.add(row.path);
            return { ...source, expandedPaths: [...expanded] };
          }));
          return;
        }
        if (input === "C") {
          setState(prev => updateCurrentSource(prev, source => ({ ...source, expandedPaths: ["root"] })));
          return;
        }
        if (input === "E") {
          setState(prev => updateCurrentSource(prev, source => ({ ...source, expandedPaths: jsonRows.filter(row => row.expandable).map(row => row.path) })));
          return;
        }
        if (input === "n") {
          setState(prev =>
            updateCurrentSource(prev, source => ({
              ...source,
              detailCursor:
                selectedEntry?.kind === "json" && detailMode === "tree"
                  ? detailSearch.next(source.detailCursor)
                  : textSearch.next(source.detailCursor),
            })),
          );
          return;
        }
        if (input === "N") {
          setState(prev =>
            updateCurrentSource(prev, source => ({
              ...source,
              detailCursor:
                selectedEntry?.kind === "json" && detailMode === "tree"
                  ? detailSearch.prev(source.detailCursor)
                  : textSearch.prev(source.detailCursor),
            })),
          );
          return;
        }
        if (input === "y") {
          pendingYankRef.current = true;
          setState(prev => ({ ...prev, statusLine: "Yank pending: yy value, yp path, yk key" }));
          return;
        }
      }
      if (key.escape) {
        setState(prev => ({ ...prev, focusMode: "list" }));
      }
      return;
    }

    if (input === "g") {
      setState(prev => updateCurrentSource(prev, source => ({ ...source, selectedIndex: 0, follow: false })));
      return;
    }

    if (input === "G") {
      setState(prev => updateCurrentSource(prev, source => ({ ...source, selectedIndex: Math.max(0, getVisibleEntries(source).length - 1), follow: true })));
      return;
    }

    if (key.pageUp) {
      setState(prev => updateCurrentSource(prev, source => ({ ...source, selectedIndex: Math.max(0, source.selectedIndex - 10), follow: false })));
      return;
    }

    if (key.pageDown) {
      setState(prev => updateCurrentSource(prev, source => {
        const max = Math.max(0, getVisibleEntries(source).length - 1);
        const next = Math.min(max, source.selectedIndex + 10);
        return { ...source, selectedIndex: next, follow: next === max };
      }));
      return;
    }

    if (key.upArrow || input === "k") {
      setState(prev => updateCurrentSource(prev, source => ({ ...source, selectedIndex: Math.max(0, source.selectedIndex - 1), follow: false })));
      return;
    }

    if (key.downArrow || input === "j") {
      setState(prev => updateCurrentSource(prev, source => {
        const max = Math.max(0, getVisibleEntries(source).length - 1);
        const next = Math.min(max, source.selectedIndex + 1);
        return { ...source, selectedIndex: next, follow: next === max };
      }));
    }
  });

  return (
    <FullscreenLayout
      header={
        <Header
          source={activeSource}
          activeIndex={activeSourceIndex}
          totalSources={sources.length}
          mergedView={mergedView}
        />
      }
      body={
        <Box flexDirection="row">
          <Box width={listWidth} flexDirection="column">
            <LogList
              entries={visibleWindow}
              selectedIndex={selectedIndex}
              startIndex={start}
              columns={listColumns}
              showSourceLabel={mergedView}
            />
          </Box>
          <Box width={2} />
          <Box flexGrow={1} flexDirection="column">
            {focusMode === "filter" ? (
              <FilterBar
                value={filterDraft}
                onChange={value => setState(prev => ({ ...prev, filterDraft: value }))}
                onSubmit={value =>
                  setState(prev =>
                    updateCurrentSource({ ...prev, focusMode: "list", filterDraft: "" }, source => ({
                      ...source,
                      filter: value,
                      selectedIndex: 0,
                      follow: false,
                    })),
                  )
                }
              />
            ) : focusMode === "query" ? (
              <QueryBar
                value={queryDraft}
                suggestions={querySuggestions}
                selectedSuggestionIndex={selectedSuggestionIndex}
                onChange={value => setState(prev => ({ ...prev, queryDraft: value }))}
                onSubmit={value =>
                  setState(prev =>
                    updateCurrentSource(
                      {
                        ...prev,
                        focusMode: "list",
                        queryDraft: "",
                        querySuggestionIndex: 0,
                      },
                      source => ({
                        ...source,
                        query: value,
                        selectedIndex: 0,
                        follow: false,
                      }),
                    ),
                  )
                }
              />
            ) : focusMode === "search" ? (
              <SearchBar
                value={detailSearchDraft}
                onChange={value => setState(prev => ({ ...prev, detailSearchDraft: value }))}
                onSubmit={value =>
                  setState(prev => ({
                    ...prev,
                    focusMode: "detail",
                    detailSearchDraft: "",
                    detailSearchTerm: value,
                    detailSearchMatches:
                      selectedEntry?.kind === "json" && detailMode === "tree"
                        ? createDetailSearch(jsonRows, value).matches
                        : createTextSearch(selectedEntry?.raw ?? "", value).matches,
                  }))
                }
              />
            ) : (
              <DetailPane
                entry={selectedEntry}
                detailMode={detailMode}
                jsonRows={jsonRows}
                jsonCursor={activeSource?.detailCursor ?? 0}
                searchTerm={detailSearchTerm}
                searchMatches={detailMatches}
                mergedView={mergedView}
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
          query={activeSource?.query ?? ""}
          search={detailSearchTerm}
          mergedView={mergedView}
        />
      }
      overlay={showHelp ? <HelpModal /> : undefined}
    />
  );
}
