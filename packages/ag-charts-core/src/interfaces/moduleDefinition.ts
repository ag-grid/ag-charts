export enum ModuleType {
    Chart = 'chart',
    Series = 'series',
    Feature = 'feature',
}

export interface ModuleInstance {}

export interface ModuleDefinition {
    type: `${ModuleType}` | ModuleType;
    enterprise?: boolean;
    name: string;

    options?: object; // options definitions validation
    style?: string; // css string to inject into a style element
    themeTemplate?: object; // module's default theme template

    create(...args: any[]): ModuleInstance;
    detect(options: object): boolean;
}

export interface ChartModuleDefinition extends ModuleDefinition {}

export interface SeriesModuleDefinition extends ModuleDefinition {
    chartType: string;
}

export interface FeatureModuleDefinition extends ModuleDefinition {}
