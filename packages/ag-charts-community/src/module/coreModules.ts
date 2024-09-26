import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartThemeOverrides,
    AgFlowProportionSeriesOptions,
    AgHierarchySeriesOptions,
    AgLinearGaugeOptions,
    AgPolarChartOptions,
    AgPolarSeriesOptions,
    AgRadialGaugeOptions,
    AgTopologySeriesOptions,
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

type Themes = AgChartThemeOverrides & {
    'linear-gauge'?: { series: AgLinearGaugeOptions };
    'radial-gauge'?: { series: AgRadialGaugeOptions };
};

export type ExtensibleTheme<SeriesType extends RequiredSeriesType> = NonNullable<Themes[SeriesType]>;

export type SeriesTypeOptions<SeriesType extends RequiredSeriesType> = Extract<
    SeriesOptionsTypes,
    { type: SeriesType }
>;

type Axes = Record<Required<AgCartesianSeriesOptions>['type'], AgCartesianChartOptions['axes']> &
    Record<Required<AgPolarSeriesOptions>['type'], AgPolarChartOptions['axes']> &
    Record<Required<AgHierarchySeriesOptions>['type'], never> &
    Record<Required<AgTopologySeriesOptions>['type'], never> &
    Record<Required<AgFlowProportionSeriesOptions>['type'], never> & {
        'radial-gauge': AgPolarChartOptions['axes'];
        'linear-gauge': AgCartesianChartOptions['axes'];
    };

type SeriesDefaultAxes<SeriesType extends RequiredSeriesType> = Axes[SeriesType] | ((series: any) => Axes[SeriesType]);

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
    paletteFactory?: SeriesPaletteFactory<ExtensibleTheme<SeriesType>>;
    solo?: boolean;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: SeriesTypeOptions<SeriesType>) => boolean;
}
