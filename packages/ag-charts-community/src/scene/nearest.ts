export type NearestResult<T> = { nearest: T | undefined; distanceSquared: number };

export interface DistantObject {
    distanceSquared(x: number, y: number): number;
}

type NearestCalculator<TNearest> = {
    nearestSquared(x: number, y: number, maxDistance: number): NearestResult<TNearest>;
};

type DistantContainer<TNearest> = {
    get children(): NearestCalculator<TNearest>[];
    transformPoint(x: number, y: number): { x: number; y: number };
};

export function nearestSquared<TObject extends DistantObject>(
    x: number,
    y: number,
    objects: Iterable<TObject>,
    maxDistanceSquared = Infinity
): NearestResult<TObject> {
    const result: NearestResult<TObject> = { nearest: undefined, distanceSquared: maxDistanceSquared };
    for (const obj of objects) {
        const thisDistance = obj.distanceSquared(x, y);
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
    x: number,
    y: number,
    container: DistantContainer<TNearest>,
    maxDistanceSquared = Infinity
): NearestResult<TNearest> {
    const { x: tx, y: ty } = container.transformPoint(x, y);
    const result: NearestResult<TNearest> = { nearest: undefined, distanceSquared: maxDistanceSquared };
    for (const child of container.children) {
        const { nearest, distanceSquared } = child.nearestSquared(tx, ty, result.distanceSquared);
        if (distanceSquared === 0) {
            return { nearest, distanceSquared };
        } else if (distanceSquared < result.distanceSquared) {
            result.nearest = nearest;
            result.distanceSquared = distanceSquared;
        }
    }
    return result;
}
