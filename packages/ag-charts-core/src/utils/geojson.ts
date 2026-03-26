import { attachDescription } from '../state/validation';
import { isNumberEqual } from './data/numbers';
import { isFiniteNumber, isObject } from './types/typeGuards';

function isValidCoordinate(value: unknown): boolean {
    return Array.isArray(value) && value.length >= 2 && value.every(isFiniteNumber);
}

function isValidCoordinates(value: unknown): boolean {
    return Array.isArray(value) && value.length >= 2 && value.every(isValidCoordinate);
}

function hasSameStartEndPoint(c: number[][]): boolean {
    const start = c[0];
    const end = c.at(-1);
    if (end === undefined) return false;
    return isNumberEqual(start[0], end[0], 1e-3) && isNumberEqual(start[1], end[1], 1e-3);
}

function isValidPolygon(value: unknown): boolean {
    return Array.isArray(value) && value.every(isValidCoordinates) && value.every(hasSameStartEndPoint);
}

function isValidGeometry(value: unknown): boolean {
    if (value === null) return true;
    if (!isObject(value) || value.type == null) return false;

    const { type, coordinates } = value;

    switch (type) {
        case 'GeometryCollection':
            return Array.isArray(value.geometries) && value.geometries.every(isValidGeometry);
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
        default:
            return false;
    }
}

function isValidFeature(value: unknown): boolean {
    return isObject(value) && value.type === 'Feature' && isValidGeometry(value.geometry);
}

function isValidFeatureCollection(value: unknown): boolean {
    return (
        isObject(value) &&
        value.type === 'FeatureCollection' &&
        Array.isArray(value.features) &&
        value.features.every(isValidFeature)
    );
}

export const geoJson = attachDescription(isValidFeatureCollection, 'a GeoJSON object');
