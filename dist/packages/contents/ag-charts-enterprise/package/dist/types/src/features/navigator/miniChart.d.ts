import { _ModuleSupport, _Scene, _Util } from 'ag-charts-community';
declare class MiniChartPadding {
    top: number;
    bottom: number;
}
export declare class MiniChart extends _ModuleSupport.BaseModuleInstance implements _ModuleSupport.ModuleInstance {
    private readonly ctx;
    enabled: boolean;
    readonly padding: MiniChartPadding;
    readonly root: _Scene.Group;
    readonly seriesRoot: _Scene.Group;
    readonly axisGridGroup: _Scene.Group;
    readonly axisGroup: _Scene.Group;
    data: any;
    private _destroyed;
    private miniChartAnimationPhase;
    axes: _ModuleSupport.ChartAxis[];
    series: _ModuleSupport.Series<any, any>[];
    constructor(ctx: _ModuleSupport.ModuleContext);
    destroy(): void;
    private onSeriesChange;
    protected destroySeries(allSeries: _ModuleSupport.Series<any, any>[]): void;
    protected assignSeriesToAxes(): void;
    protected assignAxesToSeries(): void;
    private findMatchingAxis;
    updateData(opts: {
        data: any;
    }): Promise<void>;
    processData(opts: {
        dataController: _ModuleSupport.DataController;
    }): Promise<void>;
    computeAxisPadding(): _Util.Padding;
    layout(width: number, height: number): Promise<void>;
    protected seriesRect?: _Scene.BBox;
}
export {};
