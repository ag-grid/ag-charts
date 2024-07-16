export type NearestResult<T> = {
    nearest: T | undefined;
    distanceSquared: number;
};
export interface DistantObject {
    distanceSquared(x: number, y: number): number;
}
type NearestCalculator<TNearest> = {
    nearestSquared(x: number, y: number, maxDistance: number): NearestResult<TNearest>;
};
type DistantContainer<TNearest> = {
    get children(): NearestCalculator<TNearest>[];
    transformPoint(x: number, y: number): {
        x: number;
        y: number;
    };
};
export declare function nearestSquared<TObject extends DistantObject>(x: number, y: number, objects: Iterable<TObject>, maxDistanceSquared?: number): NearestResult<TObject>;
export declare function nearestSquaredInContainer<TNearest>(x: number, y: number, container: DistantContainer<TNearest>, maxDistanceSquared?: number): NearestResult<TNearest>;
export {};
