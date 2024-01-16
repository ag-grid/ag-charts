import { _ModuleSupport } from 'ag-charts-community';
export declare class Animation extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    readonly ctx: _ModuleSupport.ModuleContext;
    enabled: boolean;
    duration?: number;
    animationManager: _ModuleSupport.AnimationManager;
    constructor(ctx: _ModuleSupport.ModuleContext);
}
