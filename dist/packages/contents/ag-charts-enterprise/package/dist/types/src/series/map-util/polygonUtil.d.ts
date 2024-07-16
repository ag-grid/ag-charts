import type { _ModuleSupport } from 'ag-charts-community';
export declare function polygonBbox(polygon: _ModuleSupport.Position[], into: _ModuleSupport.LonLatBBox | undefined): _ModuleSupport.LonLatBBox | undefined;
export declare function polygonCentroid(polygon: _ModuleSupport.Position[]): _ModuleSupport.Position | undefined;
export declare function preferredLabelCenter(polygons: _ModuleSupport.Position[][], size: {
    width: number;
    height: number;
}, precision: number): _ModuleSupport.Position | undefined;
/** Distance from a point to a polygon. Negative if inside the polygon. */
export declare function polygonRectDistance(polygons: _ModuleSupport.Position[][], center: _ModuleSupport.Position, size: {
    width: number;
    height: number;
}): number;
export declare function polygonDistance(polygons: _ModuleSupport.Position[][], x: number, y: number): number;
