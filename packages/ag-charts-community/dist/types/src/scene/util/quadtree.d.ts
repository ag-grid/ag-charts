import { BBox } from '../bbox';
import { DistantObject, NearestResult } from '../nearest';
type QuadtreeNearestResult<V> = NearestResult<QuadtreeElem<HitTesterNearest, V>>;
type HitTesterExact = {
    getCachedBBox(): BBox;
    containsPoint(x: number, y: number): boolean;
};
type HitTesterNearest = DistantObject & {
    readonly midPoint: {
        x: number;
        y: number;
    };
};
type HitTester = HitTesterExact | HitTesterNearest;
type QuadtreeElem<H extends HitTester, V> = {
    hitTester: H;
    value: V;
};
export declare class QuadtreeExact<V> {
    private readonly exact;
    constructor(capacity: number, maxdepth: number, boundary?: BBox);
    clear(boundary: BBox): void;
    add(hitTester: HitTesterExact, value: V): void;
    find(x: number, y: number): Iterable<QuadtreeElem<HitTesterExact, V>>;
}
export declare class QuadtreeNearest<V> {
    private readonly root;
    constructor(capacity: number, maxdepth: number, boundary?: BBox);
    clear(boundary: BBox): void;
    addValue(hitTester: HitTesterNearest, value: V): void;
    find(x: number, y: number): QuadtreeNearestResult<V>;
}
export {};
