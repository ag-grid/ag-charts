import type {
    NormalisedLegendOptions,
    NormalisedSelectionOptions,
    NormalisedZoomOptions,
    ZoomState,
} from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { CategoryLegendDatum } from './legend/legendDatum';

export type ResolvedChartOptions = Omit<AgChartOptions, 'legend' | 'selection' | 'zoom'> & {
    legend: NormalisedLegendOptions;
    selection: NormalisedSelectionOptions;
    zoom: NormalisedZoomOptions;
};

export interface ChartState {
    options: ResolvedChartOptions;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
    zoom: ZoomState | undefined;
    initialZoom: ZoomState | undefined;
}
