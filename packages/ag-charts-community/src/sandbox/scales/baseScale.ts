import type { IScale } from './scaleTypes';

export abstract class BaseScale<D, R> implements IScale<D, R> {
    protected sortCompare?: (a: D, b: D) => number;

    constructor(
        public readonly domain: D[],
        public readonly range: R[]
    ) {
        domain.sort(this.sortCompare);
    }

    abstract convert(value: D, clamp?: boolean): R;
    abstract invert(value: R, clamp?: boolean): D;

    reverse() {
        this.range.reverse();
    }
}
