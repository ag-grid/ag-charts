import type { BaseModule, ModuleInstance } from './baseModule';
import type { ChartAxis } from '../chart/chartAxis';
import type { Series } from '../chart/series/series';
import type { ChartLegend, ChartLegendType } from '../chart/legendDatum';
import type { ModuleContext } from './moduleContext';
import type { AgBaseChartThemeOverrides, AgChartOptions } from '../options/agChartOptions';

export type AxisConstructor = new (moduleContext: ModuleContext) => ChartAxis;
export type SeriesConstructor = new (moduleContext: ModuleContext) => Series<any>;
export type LegendConstructor = new (moduleContext: ModuleContext) => ChartLegend;

export type SeriesPaletteOptions<
    SeriesType extends RequiredSeriesType,
    SeriesOpts = NonNullable<AgChartOptions['series']>[number] & { type: SeriesType },
    ColourKeys = 'stroke' | 'fill' | 'fills' | 'strokes' | 'colors',
    NestedKeys = 'marker' | 'calloutLine'
> = {
    [K in keyof SeriesOpts & ColourKeys]: NonNullable<SeriesOpts[K]>;
} & {
    [K in keyof SeriesOpts & NestedKeys]: {
        [K2 in keyof NonNullable<SeriesOpts[K]> & ColourKeys]: NonNullable<NonNullable<SeriesOpts[K]>[K2]>;
    };
};

export interface SeriesPaletteFactoryParams {
    takeColors: (count: number) => { fills: string[]; strokes: string[] };
    colorsCount: number;
}

export type SeriesPaletteFactory<SeriesType extends RequiredSeriesType = RequiredSeriesType> = (
    params: SeriesPaletteFactoryParams
) => SeriesPaletteOptions<SeriesType>;

export interface RootModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'root';

    instanceConstructor: new (ctx: ModuleContext) => M;

    themeTemplate?: {};
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

type RequiredSeriesType = NonNullable<NonNullable<AgChartOptions['series']>[number]['type']>;
type Extensible<T> = { [K in keyof T]?: NonNullable<T[K]> extends object ? Extensible<T[K]> : T[K] } & {
    __extends__?: string;
};
type SeriesTheme<SeriesType extends RequiredSeriesType> = NonNullable<AgBaseChartThemeOverrides[SeriesType]>['series'];
type ExtensibleTheme<SeriesType extends RequiredSeriesType> = Extensible<SeriesTheme<SeriesType>>;

export interface SeriesModule<SeriesType extends RequiredSeriesType = RequiredSeriesType> extends BaseModule {
    type: 'series';

    identifier: SeriesType;
    instanceConstructor: SeriesConstructor;

    seriesDefaults: AgChartOptions;
    themeTemplate: ExtensibleTheme<SeriesType>;
    paletteFactory?: SeriesPaletteFactory<SeriesType>;
    stackable?: boolean;
    groupable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: AgChartOptions) => boolean;
}
