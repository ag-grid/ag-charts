/** GeoJSON types based on https://datatracker.ietf.org/doc/html/rfc7946 */
export type Position = [number, number];
type BBox = [number, number, number, number] | [number, number, number, number, number, number];
export type Geometry = Point | MultiPoint | LineString | MultiLineString | Polygon | MultiPolygon | GeometryCollection;
interface GeometryCollection extends GeoJsonObject {
    type: 'GeometryCollection';
    geometries: Geometry[];
}
interface Point extends GeoJsonObject {
    type: 'Point';
    coordinates: Position;
}
interface MultiPoint extends GeoJsonObject {
    type: 'MultiPoint';
    coordinates: Position[];
}
interface LineString extends GeoJsonObject {
    type: 'LineString';
    coordinates: Position[];
}
interface MultiLineString extends GeoJsonObject {
    type: 'MultiLineString';
    coordinates: Position[][];
}
interface Polygon extends GeoJsonObject {
    type: 'Polygon';
    coordinates: Position[][];
}
interface MultiPolygon extends GeoJsonObject {
    type: 'MultiPolygon';
    coordinates: Position[][][];
}
interface GeoJsonObject {
    type: (Geometry | Feature | FeatureCollection)['type'];
    bbox?: BBox | undefined;
}
export interface Feature extends GeoJsonObject {
    type: 'Feature';
    geometry: Geometry | null;
    id?: string | number;
    properties: Record<string, any> | null;
}
export interface FeatureCollection extends GeoJsonObject {
    type: 'FeatureCollection';
    features: Feature[];
}
export {};
