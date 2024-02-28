import type { Point } from './point';

export type NearestResult<T> = { nearest: T | undefined; distanceSquared: number };

export interface DistantObject {
    distanceSquared(point: Point): number;
}

type NearestCalculator<TNearest> = {
    nearestSquared(point: Point, maxDistance: number): NearestResult<TNearest>;
};

type DistantContainer<TNearest> = {
    get children(): NearestCalculator<TNearest>[];
    transformPoint(x: number, y: number): Point;
};

export function nearestSquared<TObject extends DistantObject>(
    point: Point,
    objects: Iterable<TObject>,
    maxDistanceSquared = Infinity
): NearestResult<TObject> {
    const result: NearestResult<TObject> = { nearest: undefined, distanceSquared: maxDistanceSquared };
    for (const obj of objects) {
        const thisDistance = obj.distanceSquared(point);
        if (thisDistance === 0) {
            return { nearest: obj, distanceSquared: 0 };
        } else if (thisDistance < result.distanceSquared) {
            result.nearest = obj;
            result.distanceSquared = thisDistance;
        }
    }
    return result;
}

export function nearestSquaredInContainer<TNearest>(
    point: Point,
    container: DistantContainer<TNearest>,
    maxDistanceSquared = Infinity
): NearestResult<TNearest> {
    const tpoint = container.transformPoint(point.x, point.y);
    const result: NearestResult<TNearest> = { nearest: undefined, distanceSquared: maxDistanceSquared };
    for (const child of container.children) {
        const { nearest, distanceSquared } = child.nearestSquared(tpoint, result.distanceSquared);
        if (distanceSquared === 0) {
            return { nearest, distanceSquared };
        } else if (distanceSquared < result.distanceSquared) {
            result.nearest = nearest;
            result.distanceSquared = distanceSquared;
        }
    }
    return result;
}
