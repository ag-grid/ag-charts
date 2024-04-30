import { _ModuleSupport } from 'ag-charts-community';
export interface DataSourceGetDataCallbackParams {
    windowStart?: Date;
    windowEnd?: Date;
}
export declare class DataSource extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    enabled: boolean;
    getData: (params: DataSourceGetDataCallbackParams) => Promise<unknown>;
    requestThrottle?: number;
    updateThrottle?: number;
    updateDuringInteraction?: boolean;
    private readonly dataService;
    constructor(ctx: _ModuleSupport.ModuleContext);
    private updateCallback;
}
