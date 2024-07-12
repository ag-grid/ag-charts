export interface BBoxValues {
    x: number;
    y: number;
    width: number;
    height: number;
}
export interface BBoxContainsTester {
    containsPoint(x: number, y: number): boolean;
}
export interface BBoxProvider<T = BBoxValues> {
    computeTransformedRegionBBox?(): T;
    computeTransformedBBox(): T;
}
