// Route geometry, shared by the live tracking feed (where a shipment is now) and the
// route topology (the arc it travels along), so a marker always sits on its own line.
import type { GeoPoint } from './types';

/** A GeoJSON `[longitude, latitude]` position. */
type Position = [number, number];

/** Largest latitude excursion an arc adds at its midpoint, in degrees. */
const MAX_BULGE_DEGREES = 20;

/** Wraps a longitude into the `[-180, 180]` range GeoJSON requires. */
const wrapLongitude = (longitude: number) => ((((longitude + 180) % 360) + 360) % 360) - 180;

/**
 * Shortest signed longitude delta from `from` to `to`, in `(-180, 180]`.
 *
 * Working in this unwrapped space is what lets a route take the short way round: the raw
 * difference between +139° (Yokohama) and −83° (Detroit) is −222°, the long way east
 * across Asia and Europe, when the lane actually runs +138° west across the Pacific.
 */
function shortestLongitudeDelta(from: number, to: number): number {
    const delta = wrapLongitude(to - from);
    return delta === -180 ? 180 : delta;
}

/**
 * Interpolates along a shipment's drawn route.
 *
 * This is a bounded arc — linear in longitude and latitude, with a bulge towards the
 * nearer pole — rather than a true great circle. A great circle is the geometrically
 * shortest path, but for a near-antipodal lane such as Chennai to Detroit it runs over
 * the North Pole, where an equirectangular map stretches it into a spike and the
 * longitude sweeps through most of the world. It is also not the route the freight takes:
 * that sailing goes via Suez. A capped arc reads as a shipping lane, keeps every route
 * inside the map's own extent, and stays monotonic in longitude so a marker moves
 * steadily from origin to destination.
 */
export function interpolateRoute(from: GeoPoint, to: GeoPoint, fraction: number): GeoPoint {
    const deltaLon = shortestLongitudeDelta(from.longitude, to.longitude);
    const deltaLat = to.latitude - from.latitude;

    const span = Math.hypot(deltaLon, deltaLat);
    const bulge = Math.min(MAX_BULGE_DEGREES, span * 0.16);
    // Bulge away from the equator, so a northern lane arcs north and a southern one south.
    const midLatitude = (from.latitude + to.latitude) / 2;
    const direction = midLatitude < 0 ? -1 : 1;

    const latitude = from.latitude + deltaLat * fraction + direction * bulge * Math.sin(Math.PI * fraction);

    return {
        latitude: Math.max(-85, Math.min(85, latitude)),
        longitude: wrapLongitude(from.longitude + deltaLon * fraction),
    };
}

/**
 * Traces a route as GeoJSON line segments.
 *
 * Returns a list of segments rather than one line because a route crossing the
 * antimeridian has to be cut there: longitude jumps from +180 to −180, and a renderer
 * joining those two points draws a straight line back across the whole map. Every
 * trans-Pacific lane in this demo crosses it, so this is the normal case, not an edge
 * case. Each cut adds the boundary point to both sides, so the halves meet at the map
 * edge rather than stopping short of it.
 */
export function routeSegments(from: GeoPoint, to: GeoPoint, steps = 64): Position[][] {
    const points = Array.from({ length: steps + 1 }, (_, i) => interpolateRoute(from, to, i / steps));

    const segments: Position[][] = [];
    let current: Position[] = [[points[0].longitude, points[0].latitude]];

    for (let i = 1; i < points.length; i++) {
        const previous = points[i - 1];
        const point = points[i];
        if (Math.abs(point.longitude - previous.longitude) > 180) {
            // Westbound crossings run +180 → −180, eastbound the other way.
            const edge = previous.longitude > 0 ? 180 : -180;
            // Fraction of the step at which the path reaches the edge, measured on the
            // unwrapped longitude so the interval is monotonic.
            const unwrapped = point.longitude + (edge > 0 ? 360 : -360);
            const t = (edge - previous.longitude) / (unwrapped - previous.longitude);
            const latitude = previous.latitude + (point.latitude - previous.latitude) * t;
            current.push([edge, latitude]);
            segments.push(current);
            current = [[-edge, latitude]];
        }
        current.push([point.longitude, point.latitude]);
    }

    segments.push(current);
    return segments;
}
