import { type AgChartSyncOptions, _ModuleSupport } from 'ag-charts-community';
declare const BaseProperties: typeof _ModuleSupport.BaseProperties;
export declare class ChartSync extends BaseProperties implements _ModuleSupport.ModuleInstance, AgChartSyncOptions {
    protected moduleContext: _ModuleSupport.ModuleContext;
    static readonly className = "Sync";
    enabled: boolean;
    groupId?: string;
    axes: 'x' | 'y' | 'xy';
    nodeInteraction: boolean;
    zoom: boolean;
    constructor(moduleContext: _ModuleSupport.ModuleContext);
    private updateChart;
    private updateSiblings;
    private enabledZoomSync;
    private disableZoomSync?;
    private enabledNodeInteractionSync;
    private disableNodeInteractionSync?;
    syncAxes(stopPropagation?: boolean): void;
    private mergeZoom;
    private onEnabledChange;
    private onGroupIdChange;
    private onAxesChange;
    private onNodeInteractionChange;
    private onZoomChange;
    destroy(): void;
}
export {};
