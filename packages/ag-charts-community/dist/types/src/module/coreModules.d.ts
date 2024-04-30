import type { ChartLegend, ChartLegendType } from '../chart/legendDatum';
import type { Series } from '../chart/series/series';
import type { AgCartesianChartOptions, AgChartThemeOverrides, AgPolarChartOptions } from '../options/agChartOptions';
import type { AgChartOptions } from '../options/chart/chartBuilderOptions';
import type { NextSeriesOptionTypes } from '../options/next';
import type { BaseModule, ChartTypes, ModuleInstance } from './baseModule';
import type { NextSeriesTypes, RequiredSeriesType, SeriesPaletteFactory } from './coreModulesTypes';
import type { ModuleContext } from './moduleContext';
type ModuleInstanceConstructor<M> = new (moduleContext: ModuleContext) => M;
export type SeriesConstructor = ModuleInstanceConstructor<Series<any, any>>;
export type LegendConstructor = ModuleInstanceConstructor<ChartLegend>;
export interface RootModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'root';
    instanceConstructor: ModuleInstanceConstructor<M>;
    themeTemplate?: {};
}
export interface LegendModule extends BaseModule {
    type: 'legend';
    identifier: ChartLegendType;
    instanceConstructor: LegendConstructor;
    themeTemplate?: {};
}
type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number] | NextSeriesOptionTypes;
type Extensible<T> = {
    [K in keyof T]?: NonNullable<T[K]> extends object ? Extensible<T[K]> : T[K];
} & {
    __extends__?: string;
};
export type ExtensibleTheme<SeriesType extends RequiredSeriesType> = SeriesType extends NextSeriesTypes ? any : Extensible<NonNullable<AgChartThemeOverrides[SeriesType]>>;
export type SeriesTypeOptions<SeriesType extends RequiredSeriesType> = Extract<SeriesOptionsTypes, {
    type: SeriesType;
}>;
type OptionsSeriesType<T extends AgChartOptions> = NonNullable<T['series']>[number]['type'];
type SeriesDefaultAxes<SeriesType extends RequiredSeriesType> = SeriesType extends OptionsSeriesType<AgCartesianChartOptions> ? AgCartesianChartOptions['axes'] : SeriesType extends OptionsSeriesType<AgPolarChartOptions> ? AgPolarChartOptions['axes'] : never;
export interface SeriesModule<SeriesType extends RequiredSeriesType = RequiredSeriesType, ChartType extends ChartTypes = ChartTypes> extends BaseModule<ChartType> {
    type: 'series';
    identifier: SeriesType;
    instanceConstructor: SeriesConstructor;
    hidden?: boolean;
    defaultAxes?: SeriesDefaultAxes<SeriesType>;
    themeTemplate: ExtensibleTheme<SeriesType>;
    enterpriseThemeTemplate?: ExtensibleTheme<SeriesType>;
    paletteFactory?: SeriesPaletteFactory<SeriesType>;
    solo?: boolean;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: SeriesTypeOptions<SeriesType>) => boolean;
}
export {};
