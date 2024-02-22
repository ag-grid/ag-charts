import type { AgBoxPlotSeriesStyles } from 'ag-charts-community';
import { _ModuleSupport, _Scene } from 'ag-charts-community';
import type { BoxPlotNodeDatum } from './boxPlotTypes';
export declare class BoxPlotGroup extends _Scene.Group {
    constructor();
    updateDatumStyles(datum: BoxPlotNodeDatum, activeStyles: _ModuleSupport.DeepRequired<AgBoxPlotSeriesStyles>, isVertical: boolean, isReversedValueAxis?: boolean): void;
}
