/**
 * A module exported by `ag-charts-community` or `ag-charts-enterprise`, such as `LineSeriesModule`.
 */
export interface AgChartModuleDefinition {
    readonly type: string;
    readonly name: string;
    readonly version: string;
}

/** A single module, or a bundle of modules such as `AllCommunityModule`. */
export type AgChartModule = AgChartModuleDefinition | AgChartModuleDefinition[];

/** Parameters controlling how a chart instance is created, passed as the second argument to `AgCharts.create()`. */
export interface AgChartParams {
    /**
     * Modules registered for this chart instance only, in addition to any registered globally with
     * `ModuleRegistry.registerModules()`.
     */
    modules?: AgChartModule[];
}
