import type { ResolvedChartOptions, ZoomState } from 'ag-charts-core';
import type { AgActiveItemState } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { CategoryLegendDatum } from './legend/legendDatum';

export interface ChartState {
    options: ResolvedChartOptions;
    activeItem: AgActiveItemState | undefined;
    highlight: HighlightNodeDatum | undefined;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
    zoom: ZoomState | undefined;
    initialZoom: ZoomState | undefined;
}
