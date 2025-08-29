import type {
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgChartThemeOverrides,
    AgFlowProportionSeriesOptions,
    AgHierarchySeriesOptions,
    AgLinearGaugeOptions,
    AgPolarChartOptions,
    AgPolarSeriesOptions,
    AgRadialGaugeOptions,
    AgStandaloneSeriesOptions,
    AgTopologySeriesOptions,
    DatumDefault,
    WithThemeParams,
} from 'ag-charts-types';

import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { ChartType } from '../chart/factory/chartTypes';
import type { ChartLegend, ChartLegendType } from '../chart/legend/legendDatum';
import type { Series } from '../chart/series/series';
import type { BaseModule, BaseOptionsModule, ModuleInstance } from './baseModule';
import type { RequiredSeriesType } from './coreModulesTypes';
import type { ModuleContext } from './moduleContext';

type ModuleInstanceFactory<M> = (moduleContext: ModuleContext) => M;
export type SeriesFactory = ModuleInstanceFactory<Series<unknown, any, object, any>>;
export type LegendFactory = ModuleInstanceFactory<ChartLegend>;

export interface RemovableModule {
    /** Force whether this is a removable module or not, depending on user options. */
    removable?: boolean | 'standalone-only';
}

export interface ContextModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'context';

    moduleFactory: ModuleInstanceFactory<M>;

    contextKey: string;
}

export interface RootModule<M extends ModuleInstance = ModuleInstance> extends BaseOptionsModule, RemovableModule {
    type: 'root';

    moduleFactory: ModuleInstanceFactory<M>;

    themeTemplate?: object;
}

export interface LegendModule extends BaseOptionsModule, RemovableModule {
    type: 'legend';

    identifier: ChartLegendType;
    moduleFactory: LegendFactory;

    themeTemplate?: object;
}

type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number];

type Themes = AgChartThemeOverrides & {
    'linear-gauge'?: { series: AgLinearGaugeOptions };
    'radial-gauge'?: { series: AgRadialGaugeOptions };
};

export type ExtensibleTheme<SeriesType extends RequiredSeriesType> = WithThemeParams<NonNullable<Themes[SeriesType]>>;

export type SeriesTypeOptions<SeriesType extends RequiredSeriesType> = Extract<
    SeriesOptionsTypes,
    { type: SeriesType }
>;

type Axes = Record<Required<AgCartesianSeriesOptions>['type'], AgCartesianChartOptions['axes']> &
    Record<Required<AgPolarSeriesOptions>['type'], AgPolarChartOptions['axes']> &
    Record<Required<AgHierarchySeriesOptions>['type'], never> &
    Record<Required<AgTopologySeriesOptions>['type'], never> &
    Record<Required<AgFlowProportionSeriesOptions>['type'], never> &
    Record<Required<AgStandaloneSeriesOptions>['type'], never> &
    Record<'radial-gauge' | 'linear-gauge', never>;

export type SeriesDefaultAxes<SeriesType extends RequiredSeriesType> = WithThemeParams<Axes[SeriesType]>;

type Axis = Record<Required<AgCartesianSeriesOptions>['type'], NonNullable<AgCartesianChartOptions['axes']>[number]> &
    Record<Required<AgPolarSeriesOptions>['type'], NonNullable<AgPolarChartOptions['axes']>[number]> &
    Record<Required<AgHierarchySeriesOptions>['type'], never> &
    Record<Required<AgTopologySeriesOptions>['type'], never> &
    Record<Required<AgFlowProportionSeriesOptions>['type'], never> &
    Record<Required<AgStandaloneSeriesOptions>['type'], never> &
    Record<'radial-gauge' | 'linear-gauge', never>;

export type SeriesPredictAxis<SeriesType extends RequiredSeriesType> = Axis[SeriesType];

export type SeriesTooltipDefaults = {
    range: 'exact' | 'nearest' | number;
};

export interface SeriesModule<
    SeriesType extends RequiredSeriesType = RequiredSeriesType,
    _ChartType extends ChartType = ChartType,
> extends BaseOptionsModule<_ChartType> {
    type: 'series';

    identifier: SeriesType;
    moduleFactory: SeriesFactory;
    hidden?: boolean;

    predictAxis?: (
        direction: ChartAxisDirection,
        datum: DatumDefault,
        seriesOptions: any
    ) => SeriesPredictAxis<RequiredSeriesType> | undefined;
    defaultAxes?: SeriesDefaultAxes<SeriesType>;
    themeTemplate: ExtensibleTheme<SeriesType>;
    solo?: boolean;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: SeriesTypeOptions<SeriesType>) => boolean;
}
