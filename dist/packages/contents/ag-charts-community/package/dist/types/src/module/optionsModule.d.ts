import { type AgChartOptions } from 'ag-charts-types';
import { type SeriesOptions } from '../chart/factory/seriesRegistry';
import { type ChartTheme } from '../chart/themes/chartTheme';
import type { AxisContext } from './axisContext';
import type { BaseModule, ModuleInstance } from './baseModule';
import { type PaletteType } from './coreModulesTypes';
import type { ModuleContextWithParent } from './moduleContext';
import type { SeriesType } from './optionsModuleTypes';
type AxisType = 'category' | 'number' | 'log' | 'time' | 'ordinal-time';
export interface AxisOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'axis-option';
    axisTypes: AxisType[];
    instanceConstructor: new (ctx: ModuleContextWithParent<AxisContext>) => M;
    themeTemplate: {
        [K in AxisType]?: object;
    };
}
interface ChartSpecialOverrides {
    document: Document;
    window: Window;
    overrideDevicePixelRatio?: number;
    sceneMode?: 'simple';
    type?: string;
}
type GroupingOptions = {
    grouped?: boolean;
    stacked?: boolean;
    stackGroup?: string;
    seriesGrouping?: {
        groupIndex: number;
        groupCount: number;
        stackIndex: number;
        stackCount: number;
    };
};
type GroupingSeriesOptions = SeriesOptions & GroupingOptions & {
    xKey?: string;
};
type SeriesGroup = {
    groupType: GroupingType;
    seriesType: string;
    series: GroupingSeriesOptions[];
};
declare enum GroupingType {
    DEFAULT = "default",
    STACK = "stack",
    GROUP = "group"
}
export declare class ChartOptions<T extends AgChartOptions = AgChartOptions> {
    activeTheme: ChartTheme;
    processedOptions: T;
    defaultAxes: T;
    userOptions: Partial<T>;
    specialOverrides: ChartSpecialOverrides;
    annotationThemes: any;
    type?: string;
    private readonly debug;
    constructor(userOptions: T, specialOverrides?: Partial<ChartSpecialOverrides>);
    getOptions(): T;
    diffOptions(options: T): Partial<T> | null;
    protected getSeriesThemeConfig(seriesType: string): any;
    protected getDefaultAxes(options: T): T;
    protected optionsType(options: Partial<T>): "area" | "line" | "box-plot" | "candlestick" | "ohlc" | "bullet" | "heatmap" | "range-area" | "range-bar" | "waterfall" | "nightingale" | "radar-area" | "radar-line" | "radial-bar" | "radial-column" | "sunburst" | "treemap" | "map-shape" | "map-line" | "map-marker" | "map-shape-background" | "map-line-background" | "chord" | "sankey" | "scatter" | "bubble" | "bar" | "histogram" | "donut" | "pie";
    protected sanityCheckAndCleanup(options: Partial<T>): void;
    protected swapAxesPosition(options: T): void;
    protected processAxesOptions(options: T, axesThemes: any): void;
    protected processSeriesOptions(options: T): void;
    protected processMiniChartSeriesOptions(options: T): void;
    protected getSeriesPalette(seriesType: SeriesType, options: {
        colourIndex: number;
        userPalette: PaletteType;
    }): import("./coreModulesTypes").SeriesPaletteOptions<import("./coreModulesTypes").RequiredSeriesType, (import("ag-charts-types").AgCartesianSeriesOptions | import("ag-charts-types").AgPolarSeriesOptions | import("ag-charts-types").AgHierarchySeriesOptions | import("ag-charts-types").AgTopologySeriesOptions | import("ag-charts-types").AgFlowProportionSeriesOptions) & {
        type: import("./coreModulesTypes").RequiredSeriesType;
    }, "fill" | "stroke" | "fills" | "strokes" | "colors", "marker" | "calloutLine"> | undefined;
    protected getSeriesGroupingOptions(series: SeriesOptions & GroupingOptions): {
        stacked: boolean;
        grouped: boolean;
    };
    protected setSeriesGroupingOptions(allSeries: GroupingSeriesOptions[]): T["series"];
    protected getSeriesGroupId(series: GroupingSeriesOptions): string;
    protected getSeriesGrouping(allSeries: GroupingSeriesOptions[]): SeriesGroup[];
    private getDefaultSeriesType;
    private getTooltipPositionDefaults;
    private getTooltipRangeDefaults;
    private deprecationWarnings;
    private axesTypeIntegrity;
    private seriesTypeIntegrity;
    private soloSeriesIntegrity;
    private enableConfiguredOptions;
    private removeDisabledOptions;
    private removeLeftoverSymbols;
    private specialOverridesDefaults;
}
export {};
