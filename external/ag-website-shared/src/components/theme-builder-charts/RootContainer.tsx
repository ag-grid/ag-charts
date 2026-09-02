import { strokesAreEnabled } from '@ag-website-shared/components/theme-builder/palette';
import { useRenderedTheme, useRenderedThemeInfo } from '@ag-website-shared/theming/rendered-theme';
import styled from '@emotion/styled';
import { useStore } from 'jotai';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { EditorPanel } from './EditorPanel';
import { GetThemeButton } from './GetTheme';
import { PresetSelector } from './PresetSelector';
import { PreviewPane } from './PreviewPane';
import { PREVIEW_PANES, PRIMARY_PANE, usePreviewChartType } from './chartTypes';
import { type ChartsThemeSelection, toChartTheme } from './chartsThemeOutput';
import { setStoredPalette, useStoredPalette } from './paletteModel';
import { getSelectedPresetId, setSelectedPresetId, useSelectedPresetId } from './presetModel';
import { type ChartsPreset, findPreset } from './presets';

export const RootContainer = ({ initialPreset }: { initialPreset: ChartsPreset }) => {
    const store = useStore();
    const renderedTheme = useRenderedTheme();
    const { overriddenParams } = useRenderedThemeInfo();
    const storedPalette = useStoredPalette();
    // Only to keep the preset thumbnails showing a chart that is actually on
    // screen; each pane owns the type it renders.
    const [primaryChartType] = usePreviewChartType(PRIMARY_PANE);

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
                <MenuBottom>
                    <GetThemeButton selection={selection} />
                </MenuBottom>
            </Menu>
            <Main>
                <PresetSelector chartType={primaryChartType} selectedId={preset.id} />
                <PreviewRow>
                    {PREVIEW_PANES.map((pane) => (
                        <PreviewPane
                            key={pane}
                            pane={pane}
                            theme={previewTheme}
                            strokesEnabled={strokesAreEnabled(selection.palette)}
                        />
                    ))}
                </PreviewRow>
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

    font-family: var(--text-font-family);

    @media screen and (max-width: 900px) {
        display: none;
    }
`;

const Menu = styled('div')`
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    position: relative;
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

// Pinned to the foot of the sidebar so the way out of the tool is reachable
// however far the editor list is scrolled. The fade sits over the scroller's
// last few pixels, marking the edge the button would otherwise butt against.
const MenuBottom = styled('div')`
    flex-shrink: 0;
    position: relative;
    display: flex;
    padding: 12px 10px 16px 6px;

    &:before {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        top: -12px;
        height: 12px;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, var(--color-bg-primary) 100%);
        pointer-events: none;
    }
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

// Side by side rather than stacked: the panes share the height they would
// otherwise halve, and the tool already refuses to render below 900px wide, so
// neither pane is ever squeezed past a chart's useful width.
const PreviewRow = styled('div')`
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    gap: 16px;
`;
