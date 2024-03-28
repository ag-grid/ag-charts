import { _ModuleSupport, _Scene } from 'ag-charts-community';
declare const Path: typeof _Scene.Path;
export declare enum GeoGeometryRenderMode {
    All = 3,
    Polygons = 1,
    Lines = 2
}
export declare class GeoGeometry extends Path {
    projectedGeometry: _ModuleSupport.Geometry | undefined;
    renderMode: GeoGeometryRenderMode;
    private bbox;
    private strokePath;
    computeBBox(): _Scene.BBox | undefined;
    updatePath(): void;
    drawPath(ctx: any): void;
    containsPoint(x: number, y: number): boolean;
    distanceToPoint(x: number, y: number): number;
    private geometryDistance;
    private drawGeometry;
    private drawPolygon;
    private drawLineString;
}
export {};
