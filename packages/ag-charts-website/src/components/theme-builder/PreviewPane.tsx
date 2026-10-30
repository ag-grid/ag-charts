import styled from '@emotion/styled';
import { useMemo } from 'react';

import type { AgChartTheme } from 'ag-charts-enterprise';

import { ChartPreview } from './ChartPreview';
import { PreviewOptions } from './PreviewOptions';
import {
    PREVIEW_PANE_LABELS,
    type PreviewPaneId,
    usePreviewChartType,
    usePreviewFeatures,
    usePreviewSeriesCount,
} from './chartTypes';
import { useSetEditedGroup } from './editedGroup';

interface Props {
    pane: PreviewPaneId;
    theme: AgChartTheme;
    /** Whether the series are outlined, which the palette editor's preview toggle decides. */
    strokesEnabled: boolean;
}

/**
 * One of the two preview charts, with the controls deciding what it shows. The
 * controls sit above the chart's box because they are the tool's own chrome:
 * inside it they kept the site's colours on the preset's background, putting
 * dark pills on a white surface for a light theme in dark mode.
 */
export const PreviewPane = ({ pane, theme, strokesEnabled }: Props) => {
    const [chartType, setChartType] = usePreviewChartType(pane);
    const [seriesCount, setSeriesCount] = usePreviewSeriesCount(pane);
    const [features, setFeatures] = usePreviewFeatures(pane);
    const setEditedGroup = useSetEditedGroup();

    // Withheld from the popup: the palette editor's toggle switches it for both panes.
    const availableFeatures = chartType.features.filter((id) => id !== 'seriesStrokes');
    // Memoised: the chart rebuilds its options on an identity change, so a fresh
    // object each render would restart the animation on any parent render.
    const activeFeatures = useMemo(() => ({ ...features, seriesStrokes: strokesEnabled }), [strokesEnabled, features]);

    return (
        // Reaching for the preview releases any tooltip the panel holds open
        // here: a held tooltip is frozen, so it would otherwise leave the user
        // unable to hover their own chart.
        <Pane onPointerDownCapture={() => setEditedGroup(null)}>
            <Toolbar>
                <PreviewOptions
                    paneLabel={PREVIEW_PANE_LABELS[pane]}
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                    seriesCount={seriesCount}
                    onSeriesCountChange={setSeriesCount}
                    features={features}
                    availableFeatures={availableFeatures}
                    onFeaturesChange={setFeatures}
                />
            </Toolbar>
            <Chart>
                <ChartPreview theme={theme} chartType={chartType} seriesCount={seriesCount} features={activeFeatures} />
            </Chart>
        </Pane>
    );
};

const Pane = styled('div')`
    flex: 1;
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

// Flush with the left edge of the chart below, so each pair reads as one column.
const Toolbar = styled('div')`
    flex-shrink: 0;
    display: flex;
`;

const Chart = styled('div')`
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
