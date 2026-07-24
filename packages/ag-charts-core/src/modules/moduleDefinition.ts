import type { DatumDefault, ExtensibleTheme, SeriesDefaultAxes, SeriesPredictAxis, SeriesType } from 'ag-charts-types';

import type { DynamicContext } from '../module/dynamicContext';
import type { OptionsDefs, ValidateParams, ValidationResult } from '../state/validation';
import type { AxisID } from '../types/idBranding';
import type { Normalised } from '../types/normalised-options/normalise';
import type { ScaleType } from '../types/scales';
import type { Point } from '../types/scene';

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
    enabled?: boolean;
    processData?(dataController: any): Promise<void> | void;
}

export type PickNodeDatumResult = { unsafeDatum: any; distanceSquared: number } | undefined;
// export type PickNodeDatumResult = { datum: SeriesNodeDatum; distanceSquared: number } | undefined;

export interface PropertyDefinitionOpts {
    isContinuousX: boolean;
    isContinuousY: boolean;
    xScaleType?: ScaleType;
    yScaleType?: ScaleType;
}

export interface AxisPluginModuleInstance extends ModuleInstance {
    applyOptions(this: void, options: any): void;
    /**
     * Generic axis-lifecycle hooks. Each is optional and called from the corresponding axis phase;
     * plugins read whatever live state they need from {@link AxisContext} when invoked. The names
     * are prefixed `onAxis*` so that plugins implementing them are not forced to give up unrelated
     * private `update` / `layout` helpers (e.g. chart-level `layout:complete` listeners).
     */
    onAxisUpdate?(this: void): void;
    onAxisLayout?(this: void): void;
    onScaleChange?(this: void): void;
    onGridChange?(this: void): void;
}

export interface SeriesPluginModuleInstance extends ModuleInstance {
    pickNodeExact(point: Point): PickNodeDatumResult;
    pickNodeNearest(point: Point): PickNodeDatumResult;
    pickNodeMainAxisFirst(point: Point, majorDirection: any /* ChartAxisDirection */): PickNodeDatumResult | undefined;
    getPropertyDefinitions(opts: PropertyDefinitionOpts): any[] /* PropertyDefinition<unknown>[] */;
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
    readonly version: string;
    readonly enterprise?: boolean;
    readonly dependencies?: ModuleDefinition[];
    readonly placeholder?: boolean;

    options?: OptionsDefs<TOptions>; // options definitions validation
    themeTemplate?: ExtensibleTheme<any>; // module's default theme template
    style?: string; // css string to inject into a style element

    // Lifecycle:
    register?(this: void, ctx: DynamicContext<any>): void;
    create(this: void, ...args: any[]): TInstance;
    validate?(
        this: void,
        options: unknown,
        optionsDefs: OptionsDefs<TOptions>,
        path: string,
        params?: ValidateParams
    ): ValidationResult<TOptions>;
}

export interface ChartModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Chart, TOptions> {
    options: OptionsDefs<TOptions>;
}

export interface PresetModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Preset, TOptions> {
    options: OptionsDefs<TOptions>;

    create(this: void, options: unknown, ...args: any[]): any;
    // Used only by sparklines, types should be normalised to support generic cases
    processData?(this: void, data: unknown): { data?: unknown[]; series?: Array<{ xKey: string; yKey: string }> };

    // Root-level delta keys this preset can apply on the fast path without a full reprocess.
    // These keys are preset-specific (e.g. a gauge's `value`), so declaring them here — rather
    // than in the community-side allow-list — keeps the fast-path gate free of preset knowledge.
    fastUpdateKeys?: ReadonlySet<string>;
    // Maps a fast-path delta's preset-owned root keys (see {@link fastUpdateKeys}) onto the
    // internal options shape `create` would produce, so the generic merge can apply it directly.
    processFastUpdate?(this: void, delta: Record<string, unknown>): Record<string, unknown>;
}

export interface AxisModuleDefinition<
    TOptions,
    TInstance extends ModuleInstance = ModuleInstance,
> extends ModuleDefinition<ModuleType.Axis, TOptions, TInstance> {
    readonly chartType: string;

    options: OptionsDefs<TOptions>;

    create(this: void, ctx: DynamicContext<any>, id: AxisID, options: AxisCreateOptions<TOptions>): TInstance;
}

/** The post-theme-merge options shape passed to {@link AxisModuleDefinition.create}. */
export type AxisCreateOptions<TOptions> = Normalised<TOptions>;

type SeriesThemeTemplate<TOptions> = TOptions extends { type: infer S extends SeriesType }
    ? ExtensibleTheme<S>
    : ExtensibleTheme<any>;

export interface SeriesModuleDefinition<TOptions> extends ModuleDefinition<
    ModuleType.Series,
    TOptions,
    SeriesModuleInstance
> {
    readonly chartType: string;

    themeTemplate?: SeriesThemeTemplate<TOptions>;

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
    axisKeys?: Partial<Record<string /* ChartAxisDirection */, string>>;
    axisKeysFlipped?: Partial<Record<string /* ChartAxisDirection */, string>>;
    matchingKeys?: string[];

    options: OptionsDefs<TOptions>;
}

export interface PluginModuleDefinition<TOptions, TRegistry = unknown> extends ModuleDefinition<
    ModuleType.Plugin,
    TOptions
> {
    readonly chartType?: string;

    register?(this: void, ctx: DynamicContext<TRegistry>): void;
}

export interface AxisPluginModuleDefinition<TOptions> extends ModuleDefinition<
    ModuleType.AxisPlugin,
    TOptions,
    AxisPluginModuleInstance
> {
    readonly chartType?: string;
    readonly axisTypes?: string[];
    readonly optionsKey?: string;
}

export interface SeriesPluginModuleDefinition<TOptions> extends ModuleDefinition<
    ModuleType.SeriesPlugin,
    TOptions,
    SeriesPluginModuleInstance
> {
    readonly chartType?: string;
    readonly seriesTypes?: string[];
}
