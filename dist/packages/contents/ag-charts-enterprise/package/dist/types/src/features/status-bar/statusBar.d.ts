import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const Label: typeof _Scene.Label;
declare class StatusBarLabel extends Label {
}
export declare class StatusBar extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance, _ModuleSupport.ScopeProvider {
    enabled: boolean;
    openKey?: string;
    highKey?: string;
    lowKey?: string;
    closeKey?: string;
    volumeKey?: string;
    readonly title: StatusBarLabel;
    readonly positive: StatusBarLabel;
    readonly negative: StatusBarLabel;
    layoutStyle: 'block' | 'overlay';
    readonly id = "status-bar";
    data?: any[];
    private readonly highlightManager;
    private readonly labelGroup;
    private readonly labels;
    constructor(ctx: _ModuleSupport.ModuleContext);
    processData(opts: {
        dataController: _ModuleSupport.DataController;
    }): Promise<void>;
    startPerformLayout(opts: _ModuleSupport.LayoutContext): _ModuleSupport.LayoutContext;
    performCartesianLayout(opts: {
        seriesRect: _Scene.BBox;
    }): Promise<void>;
    private updateHighlight;
}
export {};
