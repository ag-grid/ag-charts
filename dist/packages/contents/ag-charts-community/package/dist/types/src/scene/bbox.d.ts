import { Interpolating, interpolate } from '../util/interpolating';
import type { DistantObject, NearestResult } from './nearest';
type Padding = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};
type ShrinkOrGrowPosition = 'top' | 'left' | 'bottom' | 'right' | 'vertical' | 'horizontal';
export declare class BBox implements DistantObject, Interpolating<BBox> {
    x: number;
    y: number;
    width: number;
    height: number;
    static readonly zero: Readonly<BBox>;
    static readonly NaN: Readonly<BBox>;
    constructor(x: number, y: number, width: number, height: number);
    clone(): BBox;
    equals(other: BBox): boolean;
    containsPoint(x: number, y: number): boolean;
    collidesBBox(other: BBox): boolean;
    computeCenter(): {
        x: number;
        y: number;
    };
    isFinite(): boolean;
    distanceSquared(x: number, y: number): number;
    static nearestBox(x: number, y: number, boxes: BBox[]): NearestResult<BBox>;
    clip(clipRect: BBox | undefined): BBox;
    shrink(amounts: Partial<Padding>): this;
    shrink(amount: number, position?: ShrinkOrGrowPosition): this;
    grow(amounts: Partial<Padding>): this;
    grow(amount: number, position?: ShrinkOrGrowPosition): this;
    combine(other: BBox): void;
    static merge(boxes: Iterable<BBox>): BBox;
    [interpolate](other: BBox, d: number): BBox;
}
export {};
