import type {
    NormalisedLegendOptions,
    NormalisedSelectionOptions,
    NormalisedZoomOptions,
    ZoomState,
} from 'ag-charts-core';
import type { AgActiveItemState, AgChartOptions, AgChartPaddingOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { DataSelectionState } from './data/dataSelectionState';
import type { CategoryLegendDatum } from './legend/legendDatum';

export type ResolvedChartOptions = Omit<AgChartOptions, 'legend' | 'padding' | 'selection' | 'zoom'> & {
    legend: NormalisedLegendOptions;
    padding: Required<AgChartPaddingOptions>;
    selection: NormalisedSelectionOptions | undefined;
    zoom: NormalisedZoomOptions;
    // Undocumented options that the chart consumes through chartState.
    mode?: 'integrated' | 'standalone';
    withinStudio?: boolean;
};

export interface ChartState {
    options: ResolvedChartOptions;
    activeItem: AgActiveItemState | undefined;
    highlight: HighlightNodeDatum | undefined;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
    zoom: ZoomState | undefined;
    initialZoom: ZoomState | undefined;
    selectionState: DataSelectionState | undefined;
}
