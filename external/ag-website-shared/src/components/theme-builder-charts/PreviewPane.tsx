import styled from '@emotion/styled';
import type { AgChartTheme } from 'ag-charts-community';

import { ChartPreview } from './ChartPreview';
import { PreviewOptions } from './PreviewOptions';
import { PREVIEW_PANE_LABELS, type PreviewPaneId, usePreviewChartType, usePreviewSeriesCount } from './chartTypes';

/**
 * One of the two preview charts, with the controls deciding what it shows.
 *
 * The controls sit above the chart's box rather than inside it, because they are
 * the tool's own chrome and not part of the theme: inside, they kept the site's
 * colours while standing on whatever background the preset chose, so a light
 * theme in dark mode put dark pills on a white surface.
 */
export const PreviewPane = ({ pane, theme }: { pane: PreviewPaneId; theme: AgChartTheme }) => {
    const [chartType, setChartType] = usePreviewChartType(pane);
    const [seriesCount, setSeriesCount] = usePreviewSeriesCount(pane);

    return (
        <Pane>
            <Toolbar>
                <PreviewOptions
                    paneLabel={PREVIEW_PANE_LABELS[pane]}
                    chartType={chartType}
                    onChartTypeChange={setChartType}
                    seriesCount={seriesCount}
                    onSeriesCountChange={setSeriesCount}
                />
            </Toolbar>
            <Chart>
                <ChartPreview theme={theme} chartType={chartType} seriesCount={seriesCount} />
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
