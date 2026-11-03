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
import type { SeriesArea } from './series-area/seriesArea';
import type { UnknownSeries } from './series/series';

/** The community types the core chart-type contract is expressed in. */
export interface ChartEnv {
    ctx: DynamicContext<ChartRegistry>;
    series: UnknownSeries;
    axes: ChartAxes;
    seriesArea: SeriesArea;
    chartOptions: ChartOptions;
    layoutContext: LayoutContext;
}

export type ChartTypeHost = CoreChartTypeHost<ChartEnv>;
export type ChartTypeInstance = CoreChartTypeInstance<ChartEnv>;
export type SeriesHost = CoreSeriesHost<UnknownSeries>;
export type AxesHost = CoreAxesHost<ChartAxes>;
export type SeriesAxesHost = SeriesHost & AxesHost;

export interface MiniChartHost extends SeriesAxesHost {
    readonly enabled: boolean;
}

/** Installed by the `navigator` module; the cartesian chart type applies the mini chart's series and axes. */
export interface NavigatorManager {
    miniChart?: MiniChartHost;
}

// Declared here rather than in moduleContext.ts, which would otherwise import the series and axes types in a cycle.
declare module '../module/moduleContext' {
    interface ChartRegistry {
        readonly navigatorManager?: NavigatorManager;
    }
}
