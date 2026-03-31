import type { DeepResolved } from 'ag-charts-core';
import type { AgChartOptions } from 'ag-charts-types';

import type { CategoryLegendDatum } from './legend/legendDatum';

type ResolvedOptionsKeys =
    | 'container'
    | 'data'
    | 'dataIdKey'
    | 'context'
    | 'initialState'
    | 'theme'
    | 'listeners'
    | 'styleNonce';

export type ResolvedOptions<T, K extends string = ResolvedOptionsKeys> = T extends object
    ? DeepResolved<Omit<T, Extract<keyof T, K>>> & Pick<T, Extract<keyof T, K>>
    : T;

export type ResolvedChartOptions = ResolvedOptions<AgChartOptions>;

export interface ChartState {
    options: ResolvedChartOptions;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
}
