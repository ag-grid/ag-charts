import type { ChartAxis } from '../chart/chartAxis';
import type { ChartLegend, ChartLegendType } from '../chart/legendDatum';
import type { Series } from '../chart/series/series';
import type { AgChartOptions, AgChartThemeOverrides } from '../options/agChartOptions';
import type { BaseModule, ModuleInstance } from './baseModule';
import type { SeriesPaletteFactory } from './coreModulesTypes';
import type { ModuleContext } from './moduleContext';

export type AxisConstructor = new (moduleContext: ModuleContext) => ChartAxis;
export type SeriesConstructor = new (moduleContext: ModuleContext) => Series<any>;
export type LegendConstructor = new (moduleContext: ModuleContext) => ChartLegend;

export interface RootModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'root';

    instanceConstructor: new (ctx: ModuleContext) => M;

    themeTemplate?: {};
    conflicts?: Array<keyof AgChartOptions>;
}

export interface AxisModule extends BaseModule {
    type: 'axis';

    identifier: string;
    instanceConstructor: AxisConstructor;

    themeTemplate: {};
}

export interface LegendModule extends BaseModule {
    type: 'legend';

    identifier: ChartLegendType;
    instanceConstructor: LegendConstructor;

    themeTemplate?: {};
}

type SeriesOptionsTypes = NonNullable<AgChartOptions['series']>[number];

type RequiredSeriesType = NonNullable<SeriesOptionsTypes['type']>;
type Extensible<T> = { [K in keyof T]?: NonNullable<T[K]> extends object ? Extensible<T[K]> : T[K] } & {
    __extends__?: string;
};
export type ExtensibleTheme<SeriesType extends RequiredSeriesType> = Extensible<
    NonNullable<AgChartThemeOverrides[SeriesType]>
>;

export type ExtensibleDefaults<SeriesType extends RequiredSeriesType> = Extensible<
    AgChartOptions & { series?: { type: SeriesType } }
>;

export type SeriesOptions<SeriesType extends RequiredSeriesType> = Extract<SeriesOptionsTypes, { type: SeriesType }>;

export interface SeriesModule<SeriesType extends RequiredSeriesType = RequiredSeriesType> extends BaseModule {
    type: 'series';

    identifier: SeriesType;
    instanceConstructor: SeriesConstructor;

    seriesDefaults: ExtensibleDefaults<SeriesType>;
    themeTemplate: ExtensibleTheme<SeriesType>;
    enterpriseThemeTemplate?: ExtensibleTheme<SeriesType>;
    paletteFactory?: SeriesPaletteFactory<SeriesType>;
    solo?: boolean;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: SeriesOptions<SeriesType>) => boolean;
}
