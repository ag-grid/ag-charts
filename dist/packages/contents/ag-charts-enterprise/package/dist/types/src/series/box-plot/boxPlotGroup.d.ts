import type { AgBoxPlotSeriesStyle } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { BoxPlotNodeDatum } from './boxPlotTypes';
declare const Group: typeof _Scene.Group;
export declare class BoxPlotGroup extends Group implements _ModuleSupport.DistantObject {
    constructor();
    updateDatumStyles(datum: BoxPlotNodeDatum, activeStyles: _ModuleSupport.DeepRequired<AgBoxPlotSeriesStyle>, isVertical: boolean, isReversedValueAxis: boolean | undefined): void;
    distanceSquared(x: number, y: number): number;
    get midPoint(): {
        x: number;
        y: number;
    };
}
export {};
