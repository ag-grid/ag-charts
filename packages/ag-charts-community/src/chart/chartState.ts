import type { DeepRequired } from 'ag-charts-core';
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

type ResolvedOptions<T, K extends string = ResolvedOptionsKeys> = T extends object
    ? DeepRequired<Omit<T, Extract<keyof T, K>>> & Pick<T, Extract<keyof T, K>>
    : T;

export interface ChartState {
    options: ResolvedOptions<AgChartOptions>;
    legendData: Record<string, CategoryLegendDatum[]>;
    legendVisible: boolean;
}
