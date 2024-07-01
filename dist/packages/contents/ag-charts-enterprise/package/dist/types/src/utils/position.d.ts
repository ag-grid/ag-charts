import { type AgCartesianAxisPosition, _ModuleSupport, _Scene } from 'ag-charts-community';
export declare function calculateAxisLabelPosition({ x, y, labelBBox, bounds, axisPosition, axisDirection, padding, }: {
    x: number;
    y: number;
    labelBBox: _Scene.BBox;
    bounds: _Scene.BBox;
    axisPosition?: AgCartesianAxisPosition;
    axisDirection: _ModuleSupport.ChartAxisDirection;
    padding: number;
}): _Scene.Point;
export declare function buildBounds(rect: _Scene.BBox, axisPosition: AgCartesianAxisPosition, padding: number): _Scene.BBox;
