import type { OptionsDefs, ValidationResult } from '../utils/validation';

export enum ModuleType {
    Chart = 'chart',
    Series = 'series',
    Feature = 'feature',
}

export interface ModuleInstance {}

export interface ModuleDefinition<TModule extends ModuleType = ModuleType, TOptions = any> {
    type: `${TModule}` | TModule;
    enterprise?: boolean;
    name: string;

    style?: string; // css string to inject into a style element
    themeTemplate?: object; // module's default theme template
    options?: OptionsDefs<TOptions>; // options definitions validation

    // Utility Methods:
    create(this: void, ...args: any[]): ModuleInstance;
    validate?(
        this: void,
        options: unknown,
        optionsDefs: OptionsDefs<TOptions>,
        path: string
    ): ValidationResult<TOptions>;
}

export interface ChartModuleDefinition<TOptions = any> extends ModuleDefinition<ModuleType.Chart, TOptions> {
    detect(options: object): boolean;
}

export interface SeriesModuleDefinition<TOptions> extends ModuleDefinition<ModuleType.Series, TOptions> {
    chartType: string;

    options: OptionsDefs<TOptions>;
}
