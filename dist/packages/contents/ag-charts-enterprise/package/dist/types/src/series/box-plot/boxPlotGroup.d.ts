import type { AgBoxPlotSeriesStyles } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { BoxPlotNodeDatum } from './boxPlotTypes';
declare const Group: typeof _Scene.Group;
export declare class BoxPlotGroup extends Group implements _Scene.DistantObject {
    constructor();
    updateDatumStyles(datum: BoxPlotNodeDatum, activeStyles: _ModuleSupport.DeepRequired<AgBoxPlotSeriesStyles>, isVertical: boolean, isReversedValueAxis: boolean | undefined, cornerRadius: number): void;
    distanceSquared(x: number, y: number): number;
    get midPoint(): {
        x: number;
        y: number;
    };
}
export {};
