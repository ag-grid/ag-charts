interface BBoxLike {
    width: number;
    height: number;
    containsPoint(x: number, y: number): boolean;
}
export interface BBoxProvider {
    getCachedBBox(): BBoxLike;
}
export declare class BBoxSet<V> {
    private elems;
    add(value: V, getters: BBoxProvider[]): void;
    find(x: number, y: number): V[];
    [Symbol.iterator](): IterableIterator<V>;
    clear(): void;
}
export {};
