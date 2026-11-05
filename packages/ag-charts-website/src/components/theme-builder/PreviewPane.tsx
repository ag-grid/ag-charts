import styled from '@emotion/styled';

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

interface Props {
    pane: PreviewPaneId;
    theme: AgChartTheme;
}

/**
 * One of the two preview charts, with the controls deciding what it shows. The
 * controls sit above the chart's box because they are the tool's own chrome:
 * inside it they kept the site's colours on the preset's background, putting
 * dark pills on a white surface for a light theme in dark mode.
 */
export const PreviewPane = ({ pane, theme }: Props) => {
    const [chartType, setChartType] = usePreviewChartType(pane);
    const [seriesCount, setSeriesCount] = usePreviewSeriesCount(pane);
    const [features, setFeatures] = usePreviewFeatures(pane);

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
                    availableFeatures={chartType.features}
                    onFeaturesChange={setFeatures}
                />
            </Toolbar>
            <Chart>
                <ChartPreview theme={theme} chartType={chartType} seriesCount={seriesCount} features={features} />
            </Chart>
        </Pane>
    );
};

const Pane = styled('div')`
    grid-row: span 2;
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: subgrid;
`;

// Flush with the left edge of the chart below, so each pair reads as one column.
const Toolbar = styled('div')`
    min-width: 0;
    display: flex;
    align-items: flex-start;
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
