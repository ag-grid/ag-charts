import { _ModuleSupport } from 'ag-charts-community';

function isValidCoordinate(v: any) {
    return Array.isArray(v) && v.length >= 2 && v.every(_ModuleSupport.isFiniteNumber);
}

function isValidCoordinates(v: any) {
    return Array.isArray(v) && v.length >= 2 && v.every(isValidCoordinate);
}

const delta = 1e-3;
function hasSameStartEndPoint(c: number[][]) {
    return Math.abs(c[0][0] - c[c.length - 1][0]) < delta && Math.abs(c[0][1] - c[c.length - 1][1]) < delta;
}

function isValidPolygon(v: any) {
    return Array.isArray(v) && v.every(isValidCoordinates) && v.every(hasSameStartEndPoint);
}

function isValidGeometry(v: any) {
    if (v === null) return true;
    if (typeof v !== 'object' || v.type == null) return false;

    const { type, coordinates } = v;

    switch (type) {
        case 'GeometryCollection':
            return Array.isArray(v.geometries) && v.geometries.every(isValidGeometry);
        case 'MultiPolygon':
            return Array.isArray(coordinates) && coordinates.every(isValidPolygon);
        case 'Polygon':
            return isValidPolygon(coordinates);
        case 'MultiLineString':
            return Array.isArray(coordinates) && coordinates.every(isValidCoordinates);
        case 'LineString':
            return isValidCoordinates(coordinates);
        case 'MultiPoint':
            return isValidCoordinates(coordinates);
        case 'Point':
            return isValidCoordinate(coordinates);
    }
}

function isValidFeature(v: any) {
    return v !== null && typeof v === 'object' && v.type === 'Feature' && isValidGeometry(v.geometry);
}

function isValidFeatureCollection(v: any) {
    return (
        v !== null &&
        typeof v === 'object' &&
        v.type === 'FeatureCollection' &&
        Array.isArray(v.features) &&
        v.features.every(isValidFeature)
    );
}

export const GEOJSON_OBJECT = _ModuleSupport.predicateWithMessage(isValidFeatureCollection, 'a GeoJSON object');
