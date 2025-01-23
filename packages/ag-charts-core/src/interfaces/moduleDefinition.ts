import type { OptionsDefs } from '../utils/validation';

export enum ModuleType {
    Chart = 'chart',
    Series = 'series',
    Feature = 'feature',
}

export interface ModuleInstance {}

export interface ModuleDefinition<TOptions = any> {
    type: `${ModuleType}` | ModuleType;
    enterprise?: boolean;
    name: string;

    options?: OptionsDefs<TOptions>; // options definitions validation
    style?: string; // css string to inject into a style element
    themeTemplate?: object; // module's default theme template

    create(...args: any[]): ModuleInstance;
}

export interface ChartModuleDefinition<TOptions = any> extends ModuleDefinition<TOptions> {
    detect(options: object): boolean;
}

export interface SeriesModuleDefinition<TOptions> extends ModuleDefinition<TOptions> {
    chartType: string;
}

export interface FeatureModuleDefinition<TOptions = any> extends ModuleDefinition<TOptions> {}
