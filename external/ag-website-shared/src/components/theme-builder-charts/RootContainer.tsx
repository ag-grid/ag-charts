import { applyPreset } from '@ag-website-shared/theming/preset';
import { useRenderedTheme, useRenderedThemeInfo } from '@ag-website-shared/theming/rendered-theme';
import styled from '@emotion/styled';
import { useStore } from 'jotai';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ChartPreview } from './ChartPreview';
import { EditorPanel } from './EditorPanel';
import { PresetSelector } from './PresetSelector';
import { PreviewOptions } from './PreviewOptions';
import { ThemeCodePanel } from './ThemeCodePanel';
import { usePreviewChartType, usePreviewSeriesCount } from './chartTypes';
import { DEFAULT_THEME_NAME } from './chartsTheme';
import { type ChartsThemeSelection, toChartTheme } from './chartsThemeOutput';
import { setStoredPalette, useStoredPalette } from './paletteModel';
import { type ChartsPreset, PRESETS, paletteFor, toSharedPreset } from './presets';

export const RootContainer = ({ isDark }: { isDark: boolean }) => {
    const store = useStore();
    const renderedTheme = useRenderedTheme();
    const { overriddenParams } = useRenderedThemeInfo();
    const palette = useStoredPalette();
    const [chartType, setChartType] = usePreviewChartType();
    const [seriesCount, setSeriesCount] = usePreviewSeriesCount();
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const selection: ChartsThemeSelection = useMemo(
        () => ({ baseTheme: DEFAULT_THEME_NAME, params: overriddenParams, palette: palette ?? {} }),
        [overriddenParams, palette]
    );
    const previewTheme = useMemo(() => toChartTheme(selection), [selection]);

    // Fill from the tool's actual top offset to the viewport bottom. The docs
    // layout puts a sticky header - and sometimes an announcement banner - above
    // the island, so a fixed `100vh - header` overflows; measure instead.
    const containerRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState<string>();
    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const update = () => setHeight(`${window.innerHeight - el.getBoundingClientRect().top}px`);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    // When the site's dark mode toggles, keep the chosen preset selected but
    // switch to its matching light/dark variant. Skipped on first render (no
    // preset picked yet) so it never clobbers the initial preset.
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        if (!selectedId) return;
        const preset = PRESETS.find((p) => p.id === selectedId);
        if (preset) {
            applyPreset(store, toSharedPreset(preset, isDark));
            setStoredPalette(store, paletteFor(preset, isDark));
        }
    }, [isDark]);

    return (
        <Container ref={containerRef} style={height ? { height } : undefined}>
            <Menu className={renderedTheme._getParamsClassName()}>
                <SidebarHeader>Theme Builder</SidebarHeader>
                <EditorScroller>
                    <EditorPanel />
                </EditorScroller>
            </Menu>
            <Main>
                <PresetSelector
                    isDark={isDark}
                    chartType={chartType}
                    selectedId={selectedId}
                    onSelect={(preset: ChartsPreset) => setSelectedId(preset.id)}
                />
                <Preview>
                    <PreviewToolbar>
                        <PreviewOptions
                            chartType={chartType}
                            onChartTypeChange={setChartType}
                            seriesCount={seriesCount}
                            onSeriesCountChange={setSeriesCount}
                        />
                    </PreviewToolbar>
                    <ChartPreview theme={previewTheme} chartType={chartType} seriesCount={seriesCount} />
                    <ThemeCodePanel selection={selection} />
                </Preview>
            </Main>
        </Container>
    );
};

const Container = styled('div')`
    width: 100%;
    max-width: calc(var(--layout-max-width) + var(--layout-horizontal-margins) * 2);
    height: calc(100vh - var(--layout-site-header-height, 64px));
    margin: 0 auto;
    padding: 0 var(--layout-horizontal-margins);
    box-sizing: border-box;
    display: flex;
    overflow: hidden;
    user-select: none;
    cursor: default;

    font-family: -apple-system, BlinkMacSystemFont, 'IBM Plex Sans', sans-serif;

    @media screen and (max-width: 900px) {
        display: none;
    }
`;

const Menu = styled('div')`
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
`;

const EditorScroller = styled('div')`
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    // z-index:0 prevents a Safari rendering bug where scrollbars appear over tooltips
    z-index: 0;
`;

const SidebarHeader = styled('h2')`
    flex-shrink: 0;
    margin: 0;
    padding: 16px 10px 8px 6px;
    color: var(--color-fg-secondary);
    font-weight: var(--text-semibold);
    font-size: var(--text-fs-base);
`;

const Main = styled('div')`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    position: relative;
    gap: 12px;
    padding: 16px 0 20px 16px;

    // A mini chart reads at a shorter card than grid's live-grid thumbnails,
    // whose size the shared scroller defaults to.
    --preset-scroller-height: 152px;
`;

const PreviewToolbar = styled('div')`
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
    padding: 10px 12px 0;
`;

const Preview = styled('div')`
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--color-border-primary);
    border-radius: var(--radius-md, 8px);
    background: var(--color-bg-primary);
`;
