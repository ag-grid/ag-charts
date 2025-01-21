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

    style?: string; // css string to inject into a style element
    themeTemplate?: object; // module's default theme template

    create(...args: any[]): ModuleInstance;
    detect(options: object): boolean;
}

export interface ChartModuleDefinition extends ModuleDefinition {
    // create(options: ChartOptions, resources?: TransferableResources): ModuleInstance;
}
