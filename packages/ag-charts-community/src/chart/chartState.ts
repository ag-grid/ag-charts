import type { NormalisedLegendOptions, NormalisedSelectionOptions } from 'ag-charts-core';
import type { AgActiveItemState, AgChartOptions } from 'ag-charts-types';

import type { CategoryLegendDatum } from './legend/legendDatum';

export type ResolvedChartOptions = Omit<AgChartOptions, 'legend' | 'selection'> & {
    legend: NormalisedLegendOptions;
    selection: NormalisedSelectionOptions;
};

export interface ChartState {
    options: ResolvedChartOptions;
    activeItem: AgActiveItemState | undefined;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
}
