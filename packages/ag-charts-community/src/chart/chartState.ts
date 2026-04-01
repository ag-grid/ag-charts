import type { AgChartOptions, NormalisedLegendOptions } from 'ag-charts-types';

import type { CategoryLegendDatum } from './legend/legendDatum';

export type ResolvedChartOptions = Omit<AgChartOptions, 'legend'> & { legend: NormalisedLegendOptions };

export interface ChartState {
    options: ResolvedChartOptions;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
}
