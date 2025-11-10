import type { DistantObject, NearestResult } from 'ag-charts-core';
import { type BoxBounds, boxContains, boxesEqual, clamp, nearestSquared } from 'ag-charts-core';

import { type Interpolating, interpolate } from '../util/interpolating';

// For small data structs like a bounding box, objects are superior to arrays
// in terms of performance (by 3-4% in Chrome 71, Safari 12 and by 20% in Firefox 64).
// They are also self descriptive and harder to abuse.
// For example, one has to do:
// `ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);`
// rather than become enticed by the much slower:
// `ctx.strokeRect(...bbox);`
// https://jsperf.com/array-vs-object-create-access
type Padding = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};

type ShrinkOrGrowPosition = 'top' | 'left' | 'bottom' | 'right' | 'vertical' | 'horizontal';

export class BBox implements BoxBounds, DistantObject, Interpolating<BBox> {
    static readonly zero = Object.freeze(new BBox(0, 0, 0, 0)) as BBox;
    static readonly NaN = Object.freeze(new BBox(Number.NaN, Number.NaN, Number.NaN, Number.NaN)) as BBox;

    static fromObject({ x, y, width, height }: BoxBounds) {
        return new BBox(x, y, width, height);
    }

    static merge(boxes: Iterable<BoxBounds>) {
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        for (const box of boxes) {
            if (box.x < left) {
                left = box.x;
            }
            if (box.y < top) {
                top = box.y;
            }
            if (end(box.x, box.width) > right) {
                right = end(box.x, box.width);
            }
            if (end(box.y, box.height) > bottom) {
                bottom = end(box.y, box.height);
            }
        }
        return new BBox(left, top, right - left, bottom - top);
    }

    static nearestBox(x: number, y: number, boxes: BBox[]): NearestResult<BBox> {
        return nearestSquared(x, y, boxes);
    }

    constructor(
        public x: number,
        public y: number,
        public width: number,
        public height: number
    ) {}

    toDOMRect(): DOMRect {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            top: this.y,
            left: this.x,
            right: end(this.x, this.width),
            bottom: end(this.y, this.height),
            toJSON() {
                return {};
            },
        };
    }

    clone() {
        const { x, y, width, height } = this;
        return new BBox(x, y, width, height);
    }

    equals(other: BBox) {
        return boxesEqual(this, other);
    }

    containsPoint(x: number, y: number): boolean {
        return boxContains(this, x, y);
    }

    intersection(other: BBox) {
        const x0 = Math.max(this.x, other.x);
        const y0 = Math.max(this.y, other.y);
        const x1 = Math.min(end(this.x, this.width), end(other.x, other.width));
        const y1 = Math.min(end(this.y, this.height), end(other.y, other.height));

        if (x0 > x1 || y0 > y1) return;

        return new BBox(x0, y0, x1 - x0, y1 - y0);
    }

    collidesBBox(other: BBox): boolean {
        return (
            this.x < end(other.x, other.width) &&
            end(this.x, this.width) > other.x &&
            this.y < end(other.y, other.height) &&
            end(this.y, this.height) > other.y
        );
    }

    computeCenter(): { x: number; y: number } {
        return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
    }

    isFinite() {
        return (
            Number.isFinite(this.x) &&
            Number.isFinite(this.y) &&
            Number.isFinite(this.width) &&
            Number.isFinite(this.height)
        );
    }

    distanceSquared(x: number, y: number): number {
        if (this.containsPoint(x, y)) {
            return 0;
        }

        const dx = x - clamp(this.x, x, end(this.x, this.width));
        const dy = y - clamp(this.y, y, end(this.y, this.height));

        return dx * dx + dy * dy;
    }

    shrink(amounts: Partial<Padding>): this;
    shrink(amount: number, position?: ShrinkOrGrowPosition): this;
    shrink(amount: number | Partial<Padding>, position?: ShrinkOrGrowPosition) {
        if (typeof amount === 'number') {
            this.applyMargin(amount, position);
        } else {
            for (const key of Object.keys(amount) as (keyof Padding)[]) {
                const value = amount[key];
                if (typeof value === 'number') {
                    this.applyMargin(value, key as ShrinkOrGrowPosition);
                }
            }
        }

        if (this.width < 0) {
            this.width = 0;
        }
        if (this.height < 0) {
            this.height = 0;
        }

        return this;
    }

    grow(amounts: Partial<Padding>): this;
    grow(amount: number | Partial<Padding>): this;
    grow(amount: number, position?: ShrinkOrGrowPosition): this;
    grow(amount: number | Partial<Padding>, position?: ShrinkOrGrowPosition) {
        if (typeof amount === 'number') {
            this.applyMargin(-amount, position);
        } else {
            for (const key of Object.keys(amount) as (keyof Padding)[]) {
                const value = amount[key];
                if (typeof value === 'number') {
                    this.applyMargin(-value, key as ShrinkOrGrowPosition);
                }
            }
        }

        return this;
    }

    private applyMargin(value: number, position?: ShrinkOrGrowPosition) {
        switch (position) {
            case 'top':
                this.y += value;
            // fallthrough
            case 'bottom':
                this.height -= value;
                break;

            case 'left':
                this.x += value;
            // fallthrough
            case 'right':
                this.width -= value;
                break;

            case 'vertical':
                this.y += value;
                this.height -= value * 2;
                break;

            case 'horizontal':
                this.x += value;
                this.width -= value * 2;
                break;

            case undefined:
                this.x += value;
                this.y += value;
                this.width -= value * 2;
                this.height -= value * 2;
                break;
        }
    }

    translate(x: number, y: number) {
        this.x += x;
        this.y += y;
        return this;
    }

    [interpolate](other: BBox, d: number) {
        return new BBox(
            this.x * (1 - d) + other.x * d,
            this.y * (1 - d) + other.y * d,
            this.width * (1 - d) + other.width * d,
            this.height * (1 - d) + other.height * d
        );
    }
}

function end(x: number, width: number) {
    if (x === -Infinity && width === Infinity) return Infinity;
    return x + width;
}
