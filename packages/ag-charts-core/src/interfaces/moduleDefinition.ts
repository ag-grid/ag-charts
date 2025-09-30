import type { DatumDefault, ExtensibleTheme, SeriesDefaultAxes, SeriesPredictAxis, SeriesType } from 'ag-charts-types';

import type { OptionsDefs, ValidationResult } from '../utils/validation';

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
    updateData?(this: void, data: unknown): void;
    destroy?(this: void): void;
}

export interface ModuleDefinition<TModule extends ModuleType = ModuleType, TOptions = any> {
    type: `${TModule}` | TModule;
    name: string;
    enterprise?: boolean;
    placeholder?: boolean;
    attachToContext?: boolean;

    style?: string; // css string to inject into a style element
    themeTemplate?: ExtensibleTheme<any>; // module's default theme template
    options: OptionsDefs<TOptions>; // options definitions validation

    // Utility Methods:
    create(this: void, ...args: any[]): ModuleInstance;
    validate?(
        this: void,
        options: unknown,
        optionsDefs: OptionsDefs<TOptions>,
        path: string
    ): ValidationResult<TOptions>;
}

export interface ChartModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Chart, TOptions> {
    detect(options: object): boolean;
}

export interface PresetModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Preset, TOptions> {
    create(this: void, options: unknown, ...args: any[]): any;
    // Used only by sparklines, types should be normalised to support generic cases
    processData?(this: void, data: unknown): { data?: unknown[]; series?: Array<{ xKey: string; yKey: string }> };
}

export interface AxisModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Axis, TOptions> {
    chartType: string;
}

export interface SeriesModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Series, TOptions> {
    chartType: string;

    groupable?: boolean;
    stackable?: boolean;
    stackedByDefault?: boolean;
    solo?: boolean;

    predictAxis?: (
        direction: any,
        datum: DatumDefault,
        seriesOptions: any
    ) => SeriesPredictAxis<SeriesType> | undefined;
    defaultAxes?: SeriesDefaultAxes<SeriesType>;
}

export interface PluginModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Plugin, TOptions> {
    chartType?: string;
}

export interface AxisPluginModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.AxisPlugin, TOptions> {
    chartType?: string;
    axisTypes?: string[];
}

export interface SeriesPluginModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.SeriesPlugin, TOptions> {
    chartType?: string;
    seriesTypes?: string[];
}
