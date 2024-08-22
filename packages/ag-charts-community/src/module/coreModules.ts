import type {
    AgCartesianChartOptions,
    AgChartThemeOverrides,
    AgGaugeChartOptions,
    AgPolarChartOptions,
} from 'ag-charts-types';
import type { AgChartOptions } from 'ag-charts-types';

import type { ChartLegend, ChartLegendType } from '../chart/legendDatum';
import type { Series } from '../chart/series/series';
import type { BaseModule, ChartTypes, ModuleInstance } from './baseModule';
import type { RequiredSeriesType, SeriesPaletteFactory } from './coreModulesTypes';
import type { ModuleContext } from './moduleContext';

type ModuleInstanceFactory<M> = (moduleContext: ModuleContext) => M;
export type SeriesFactory = ModuleInstanceFactory<Series<any, any>>;
export type LegendFactory = ModuleInstanceFactory<ChartLegend>;

export interface RootModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'root';

    moduleFactory: ModuleInstanceFactory<M>;

    themeTemplate?: {};
}

export interface LegendModule extends BaseModule {
    type: 'legend';

    identifier: ChartLegendType;
    moduleFactory: LegendFactory;

    themeTemplate?: {};
}

type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number];

export type ExtensibleTheme<SeriesType extends RequiredSeriesType> = NonNullable<AgChartThemeOverrides[SeriesType]>;

export type SeriesTypeOptions<SeriesType extends RequiredSeriesType> = Extract<
    SeriesOptionsTypes,
    { type: SeriesType }
>;

type OptionsSeriesType<T extends AgChartOptions> = NonNullable<T['series']>[number]['type'];
type SeriesDefaultAxes<SeriesType extends RequiredSeriesType> =
    SeriesType extends OptionsSeriesType<AgCartesianChartOptions>
        ? AgCartesianChartOptions['axes']
        : SeriesType extends OptionsSeriesType<AgPolarChartOptions>
          ? AgPolarChartOptions['axes']
          : SeriesType extends OptionsSeriesType<AgGaugeChartOptions>
            ? AgPolarChartOptions['axes']
            : never;

export type SeriesTooltipDefaults = {
    range: 'exact' | 'nearest';
};

export interface SeriesModule<
    SeriesType extends RequiredSeriesType = RequiredSeriesType,
    ChartType extends ChartTypes = ChartTypes,
> extends BaseModule<ChartType> {
    type: 'series';

    identifier: SeriesType;
    moduleFactory: SeriesFactory;
    hidden?: boolean;

    tooltipDefaults: SeriesTooltipDefaults;
    defaultAxes?: SeriesDefaultAxes<SeriesType>;
    themeTemplate: ExtensibleTheme<SeriesType>;
    paletteFactory?: SeriesPaletteFactory<SeriesType>;
    solo?: boolean;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: SeriesTypeOptions<SeriesType>) => boolean;
}
