import { useRenderedTheme, useRenderedThemeInfo } from '@ag-website-shared/theming/rendered-theme';
import styled from '@emotion/styled';
import { useStore } from 'jotai';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ChartPreview } from './ChartPreview';
import { EditorPanel } from './EditorPanel';
import { PresetSelector } from './PresetSelector';
import { PreviewOptions } from './PreviewOptions';
import { ThemeCodePanel } from './ThemeCodePanel';
import { usePreviewChartType, usePreviewSeriesCount } from './chartTypes';
import { type ChartsThemeSelection, toChartTheme } from './chartsThemeOutput';
import { setStoredPalette, useStoredPalette } from './paletteModel';
import { getSelectedPresetId, setSelectedPresetId, useSelectedPresetId } from './presetModel';
import { type ChartsPreset, findPreset } from './presets';

export const RootContainer = ({ initialPreset }: { initialPreset: ChartsPreset }) => {
    const store = useStore();
    const renderedTheme = useRenderedTheme();
    const { overriddenParams } = useRenderedThemeInfo();
    const storedPalette = useStoredPalette();
    const [chartType, setChartType] = usePreviewChartType();
    const [seriesCount, setSeriesCount] = usePreviewSeriesCount();

    const preset = findPreset(useSelectedPresetId()) ?? initialPreset;

    // A first visit: the provider has applied the starting preset's params, but
    // the palette and the preset itself live outside the shared param model, so
    // they are seeded here. Each is guarded on its own - a returning user who
    // has since edited their palette must keep it.
    useLayoutEffect(() => {
        if (getSelectedPresetId(store) == null) setSelectedPresetId(store, initialPreset.id);
        if (storedPalette == null) setStoredPalette(store, initialPreset.palette);
    }, []);

    const selection: ChartsThemeSelection = useMemo(
        () => ({
            baseTheme: preset.baseTheme,
            params: overriddenParams,
            palette: storedPalette ?? preset.palette,
        }),
        [preset, overriddenParams, storedPalette]
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

    return (
        <Container ref={containerRef} style={height ? { height } : undefined}>
            <Menu className={renderedTheme._getParamsClassName()}>
                <SidebarHeader>Theme Builder</SidebarHeader>
                <EditorScroller>
                    <EditorPanel />
                </EditorScroller>
            </Menu>
            <Main>
                <PresetSelector chartType={chartType} selectedId={preset.id} />
                {/* Outside the preview, because these are the tool's controls
                    rather than part of the theme. Inside, they sat on whatever
                    background the preset chose while keeping the site's own
                    chrome, so a light theme in dark mode put dark pills and
                    near-invisible labels on a white surface. */}
                <PreviewToolbar>
                    <PreviewOptions
                        chartType={chartType}
                        onChartTypeChange={setChartType}
                        seriesCount={seriesCount}
                        onSeriesCountChange={setSeriesCount}
                    />
                </PreviewToolbar>
                <Preview>
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

// Flush with the preview's right edge below it, so the two read as one column.
const PreviewToolbar = styled('div')`
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
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
