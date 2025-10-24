import type { DatumDefault, ExtensibleTheme, SeriesDefaultAxes, SeriesPredictAxis, SeriesType } from 'ag-charts-types';

import type { Point } from '../utils/boxBounds';
import type { OptionsDefs, ValidationResult } from '../utils/validation';
import type { ScaleType } from './scaleTypes';

export enum ModuleType {
    Chart = 'chart',
    Axis = 'axis',
    Series = 'series',
    Plugin = 'plugin',
    AxisPlugin = 'axis:plugin',
    SeriesPlugin = 'series:plugin',
    Preset = 'preset',
}

export type ModuleTypeSwitch<TModule extends ModuleType, TOptions = any> = TModule extends ModuleType.Chart
    ? ChartModuleDefinition<TOptions>
    : TModule extends ModuleType.Axis
      ? AxisModuleDefinition<TOptions>
      : TModule extends ModuleType.Series
        ? SeriesModuleDefinition<TOptions>
        : TModule extends ModuleType.Preset
          ? PresetModuleDefinition<TOptions>
          : TModule extends ModuleType.Plugin
            ? PluginModuleDefinition<TOptions>
            : TModule extends ModuleType.AxisPlugin
              ? AxisPluginModuleDefinition<TOptions>
              : TModule extends ModuleType.SeriesPlugin
                ? SeriesPluginModuleDefinition<TOptions>
                : never;

export interface ModuleInstance {
    destroy?(this: void): void;
}

export interface SeriesModuleInstance extends ModuleInstance {}

export interface PluginModuleInstance extends ModuleInstance {
    processData?(dataController: any): Promise<void> | void;
}

export type PickNodeDatumResult = { datum: NonNullable<any>; distanceSquared: number } | undefined;
// export type PickNodeDatumResult = { datum: SeriesNodeDatum<DatumIndexType>; distanceSquared: number } | undefined;

export interface PropertyDefinitionOpts {
    isContinuousX: boolean;
    isContinuousY: boolean;
    xScaleType?: ScaleType;
    yScaleType?: ScaleType;
}

export interface SeriesPluginModuleInstance extends ModuleInstance {
    pickNodeExact(point: Point): PickNodeDatumResult;
    pickNodeNearest(point: Point): PickNodeDatumResult;
    pickNodeMainAxisFirst(point: Point, majorDirection: any /* ChartAxisDirection */): PickNodeDatumResult | undefined;
    getPropertyDefinitions(opts: PropertyDefinitionOpts): any[] /* DataPropertyDefinition<unknown>[] */;
    getDomain(direction: any /* ChartAxisDirection */): any[];
    getTooltipParams(): object;
}

export interface ModuleDefinition<
    TModule extends ModuleType = ModuleType,
    TOptions = any,
    TInstance extends ModuleInstance = ModuleInstance,
> {
    readonly type: `${TModule}` | TModule;
    readonly name: string;
    readonly enterprise?: boolean;
    placeholder?: boolean;

    options?: OptionsDefs<TOptions>; // options definitions validation
    themeTemplate?: ExtensibleTheme<any>; // module's default theme template
    style?: string; // css string to inject into a style element

    // Utility Methods:
    create(this: void, ...args: any[]): TInstance;
    validate?(
        this: void,
        options: unknown,
        optionsDefs: OptionsDefs<TOptions>,
        path: string
    ): ValidationResult<TOptions>;
}

export interface ChartModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Chart, TOptions> {
    options: OptionsDefs<TOptions>;

    detect(options: object): boolean;
}

export interface PresetModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Preset, TOptions> {
    options: OptionsDefs<TOptions>;

    create(this: void, options: unknown, ...args: any[]): any;
    // Used only by sparklines, types should be normalised to support generic cases
    processData?(this: void, data: unknown): { data?: unknown[]; series?: Array<{ xKey: string; yKey: string }> };
}

export interface AxisModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Axis, TOptions> {
    readonly chartType: string;

    options: OptionsDefs<TOptions>;
}

export interface SeriesModuleDefinition<TOptions>
    extends ModuleDefinition<ModuleType.Series, TOptions, SeriesModuleInstance> {
    readonly chartType: string;

    readonly groupable?: boolean;
    readonly stackable?: boolean;
    readonly stackedByDefault?: boolean;
    readonly solo?: boolean;

    predictAxis?: (
        direction: any,
        datum: DatumDefault,
        seriesOptions: any
    ) => SeriesPredictAxis<SeriesType> | undefined;
    defaultAxes?: SeriesDefaultAxes<SeriesType>;

    options: OptionsDefs<TOptions>;
}

export interface PluginModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Plugin, TOptions> {
    readonly chartType?: string;

    patchContext?(this: void, ctx: any): void;
}

export interface AxisPluginModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.AxisPlugin, TOptions> {
    readonly chartType?: string;
    readonly axisTypes?: string[];
}

export interface SeriesPluginModuleDefinition<TOptions>
    extends ModuleDefinition<ModuleType.SeriesPlugin, TOptions, SeriesPluginModuleInstance> {
    readonly chartType?: string;
    readonly seriesTypes?: string[];
}
