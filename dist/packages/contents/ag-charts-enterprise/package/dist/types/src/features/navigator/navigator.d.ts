import { _ModuleSupport, _Scene } from 'ag-charts-community';
import { MiniChart } from './miniChart';
export declare class Navigator extends _ModuleSupport.Navigator {
    miniChart: MiniChart;
    constructor(ctx: _ModuleSupport.ModuleContext);
    updateData(opts: {
        data: any;
    }): Promise<void>;
    processData(opts: {
        dataController: _ModuleSupport.DataController;
    }): Promise<void>;
    performLayout(opts: _ModuleSupport.LayoutContext): Promise<_ModuleSupport.LayoutContext>;
    performCartesianLayout(opts: {
        seriesRect: _Scene.BBox;
    }): Promise<void>;
}
