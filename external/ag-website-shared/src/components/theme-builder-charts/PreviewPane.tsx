import styled from '@emotion/styled';
import { useMemo } from 'react';

import { ChartPreview } from './ChartPreview';
import { PreviewOptions } from './PreviewOptions';
import {
    PREVIEW_PANE_LABELS,
    type PreviewPaneId,
    usePreviewChartType,
    usePreviewFeatures,
    usePreviewSeriesCount,
} from './chartTypes';
import type { ChartsTheme } from './chartsThemeOutput';

interface Props {
    pane: PreviewPaneId;
    theme: ChartsTheme;
    /** Whether the palette has strokes for an outline to be drawn in. */
    strokesEnabled: boolean;
}

/**
 * One of the two preview charts, with the controls deciding what it shows.
 *
 * The controls sit above the chart's box rather than inside it, because they are
 * the tool's own chrome and not part of the theme: inside, they kept the site's
 * colours while standing on whatever background the preset chose, so a light
 * theme in dark mode put dark pills on a white surface.
 */
export const PreviewPane = ({ pane, theme, strokesEnabled }: Props) => {
    const [chartType, setChartType] = usePreviewChartType(pane);
    const [seriesCount, setSeriesCount] = usePreviewSeriesCount(pane);
    const [features, setFeatures] = usePreviewFeatures(pane);

    // With the palette's strokes off, an outline would be drawn in the fill's
    // own colour - so the feature is neither offered nor applied, rather than
    // left as a checkbox that changes nothing. What the pane had chosen stays
    // in storage and comes back with the strokes.
    const availableFeatures = strokesEnabled
        ? chartType.features
        : chartType.features.filter((id) => id !== 'seriesStrokes');
    // Memoised because the chart rebuilds its options whenever these change by
    // identity, and a fresh object every render would restart the preview's
    // animation on any parent render.
    const activeFeatures = useMemo(
        () => (strokesEnabled ? features : { ...features, seriesStrokes: false }),
        [strokesEnabled, features]
    );

    return (
        <Pane>
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
                {/*
                 * Keyed on the factory rather than the type: a chart's preset is
                 * fixed at creation, so moving in or out of the financial one has
                 * to remount. Switching between the plain types still updates in
                 * place and keeps its animation.
                 */}
                <ChartPreview
                    key={chartType.preset ?? 'plain'}
                    theme={theme}
                    chartType={chartType}
                    seriesCount={seriesCount}
                    features={activeFeatures}
                />
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

// Flush with the left edge of the chart below it, so each pair reads as one
// column - right-aligned, the left pane's controls would sit against the right
// pane's chart and look like a caption for it.
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
