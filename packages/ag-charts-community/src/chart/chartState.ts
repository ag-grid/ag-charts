import type {
    AxisID,
    CartesianAxisDirection,
    NormalisedLegendOptions,
    NormalisedZoomOptions,
    ZoomMinMax,
} from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { CategoryLegendDatum } from './legend/legendDatum';

export type ResolvedChartOptions = Omit<AgChartOptions, 'legend' | 'zoom'> & {
    legend: NormalisedLegendOptions;
    zoom: NormalisedZoomOptions;
};

export type ZoomState = { readonly [K in AxisID]: (ZoomMinMax & { direction: CartesianAxisDirection }) | undefined };

export interface ChartState {
    options: ResolvedChartOptions;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
    zoom: ZoomState;
    zoomPanning: boolean;
}
