import type {
    AxesHost as CoreAxesHost,
    ChartTypeHost as CoreChartTypeHost,
    ChartTypeInstance as CoreChartTypeInstance,
    SeriesHost as CoreSeriesHost,
    DynamicContext,
} from 'ag-charts-core';

import type { ChartRegistry } from '../module/moduleContext';
import type { ChartOptions } from '../module/optionsModule';
import type { ChartAxes } from './chartAxes';
import type { LayoutContext } from './layout/layoutManager';
import type { ModulesManager } from './modulesManager';
import type { SeriesArea } from './series-area/seriesArea';
import type { UnknownSeries } from './series/series';

/** The community types the core chart-type contract is expressed in. */
export interface ChartEnv {
    ctx: DynamicContext<ChartRegistry>;
    series: UnknownSeries;
    axes: ChartAxes;
    seriesArea: SeriesArea;
    chartOptions: ChartOptions;
    // SPIKE: the navigator and sync lookups this serves move to their modules.
    modulesManager: ModulesManager;
    layoutContext: LayoutContext;
}

export type ChartTypeHost = CoreChartTypeHost<ChartEnv>;
export type ChartTypeInstance = CoreChartTypeInstance<ChartEnv>;
export type SeriesHost = CoreSeriesHost<UnknownSeries>;
export type AxesHost = CoreAxesHost<ChartAxes>;
export type SeriesAxesHost = SeriesHost & AxesHost;
