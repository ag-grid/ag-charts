import type { _ModuleSupport } from 'ag-charts-community';
export declare function preferredLabelCenter(polygons: _ModuleSupport.Position[][], { aspectRatio, precision }: {
    aspectRatio: number;
    precision: number;
}): {
    x: number;
    y: number;
    maxWidth: number;
} | undefined;
export declare function maxWidthOfRectConstrainedByCenterAndAspectRatioToLineSegment(a: _ModuleSupport.Position, b: _ModuleSupport.Position, cx: number, cy: number, aspectRatio: number): number;
export declare function maxWidthOfRectConstrainedByCenterAndAspectRatioToPolygon(polygons: _ModuleSupport.Position[][], cx: number, cy: number, aspectRatio: number): number;
export declare function xExtentsOfRectConstrainedByCenterAndHeightToLineSegment(into: {
    minX: number;
    maxX: number;
}, a: _ModuleSupport.Position, b: _ModuleSupport.Position, cx: number, cy: number, height: number): {
    minX: number;
    maxX: number;
};
export declare function maxWidthInPolygonForRectOfHeight(polygons: _ModuleSupport.Position[][], cx: number, cy: number, height: number): {
    x: number;
    width: number;
};
