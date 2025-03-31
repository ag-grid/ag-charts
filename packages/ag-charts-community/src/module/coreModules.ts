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
    WithThemeParams,
} from 'ag-charts-types';

import type { ChartType } from '../chart/factory/chartTypes';
import type { ChartLegend, ChartLegendType } from '../chart/legend/legendDatum';
import type { Series } from '../chart/series/series';
import type { BaseModule, BaseOptionsModule, ModuleInstance } from './baseModule';
import type { RequiredSeriesType } from './coreModulesTypes';
import type { ModuleContext } from './moduleContext';

type ModuleInstanceFactory<M> = (moduleContext: ModuleContext) => M;
export type SeriesFactory = ModuleInstanceFactory<Series<unknown, any, any>>;
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

type Themes = AgChartThemeOverrides<never> & {
    'linear-gauge'?: { series: AgLinearGaugeOptions };
    'radial-gauge'?: { series: AgRadialGaugeOptions };
};

export type ExtensibleTheme<SeriesType extends keyof Themes> = WithThemeParams<NonNullable<Themes[SeriesType]>>;

export type SeriesTypeOptions<SeriesType extends RequiredSeriesType> = Extract<
    SeriesOptionsTypes,
    { type: SeriesType }
>;

type GaugeAxes = {
    'radial-gauge': AgPolarChartOptions<never>['axes'];
    'linear-gauge': AgCartesianChartOptions<never>['axes'];
};

type Axes = Record<Required<AgCartesianSeriesOptions<never>>['type'], AgCartesianChartOptions<never>['axes']> &
    Record<Required<AgPolarSeriesOptions<never>>['type'], AgPolarChartOptions<never>['axes']> &
    Record<Required<AgHierarchySeriesOptions<never>>['type'], never> &
    Record<Required<AgTopologySeriesOptions<never>>['type'], never> &
    Record<Required<AgFlowProportionSeriesOptions<never>>['type'], never> &
    Record<Required<AgStandaloneSeriesOptions<never>>['type'], never> &
    GaugeAxes;

export type SeriesDefaultAxes<SeriesType extends RequiredSeriesType> = WithThemeParams<Axes[SeriesType]>;

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

    tooltipDefaults: SeriesTooltipDefaults;
    defaultAxes?: SeriesDefaultAxes<SeriesType>;
    themeTemplate: ExtensibleTheme<SeriesType>;
    solo?: boolean;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: SeriesTypeOptions<SeriesType>) => boolean;
}
