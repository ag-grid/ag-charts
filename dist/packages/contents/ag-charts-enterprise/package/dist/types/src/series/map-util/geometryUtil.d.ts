import type { _ModuleSupport } from 'ag-charts-community';
export declare function geometryBbox(geometry: _ModuleSupport.Geometry, into: _ModuleSupport.LonLatBBox | undefined): _ModuleSupport.LonLatBBox | undefined;
export declare function largestPolygon(geometry: _ModuleSupport.Geometry): _ModuleSupport.Position[][] | undefined;
export declare function largestLineString(geometry: _ModuleSupport.Geometry): _ModuleSupport.Position[] | undefined;
export declare enum GeometryType {
    Any = 7,
    Polygon = 1,
    LineString = 2,
    Point = 4
}
export declare function containsType(geometry: _ModuleSupport.Geometry | null, type: GeometryType): boolean;
export declare function projectGeometry(geometry: _ModuleSupport.Geometry, scale: _ModuleSupport.MercatorScale): _ModuleSupport.Geometry;
