// For small data structs like a bounding box, objects are superior to arrays
import { Interpolating, interpolate } from '../util/interpolating';
import { clamp } from '../util/number';
// in terms of performance (by 3-4% in Chrome 71, Safari 12 and by 20% in Firefox 64).
// They are also self descriptive and harder to abuse.
// For example, one has to do:
// `ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height);`
// rather than become enticed by the much slower:
// `ctx.strokeRect(...bbox);`
// https://jsperf.com/array-vs-object-create-access
import type { DistantObject, NearestResult } from './nearest';
import { nearestSquared } from './nearest';
import type { Point } from './point';

type Padding = {
    top: number;
    left: number;
    right: number;
    bottom: number;
};

type ShrinkOrGrowPosition = 'top' | 'left' | 'bottom' | 'right' | 'vertical' | 'horizontal';

export class BBox implements DistantObject, Interpolating<BBox> {
    x: number;
    y: number;
    width: number;
    height: number;

    static zero = new BBox(0, 0, 0, 0);

    constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    clone() {
        const { x, y, width, height } = this;
        return new BBox(x, y, width, height);
    }

    equals(other: BBox) {
        return this.x === other.x && this.y === other.y && this.width === other.width && this.height === other.height;
    }

    containsPoint(x: number, y: number): boolean {
        return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
    }

    collidesBBox(other: BBox): boolean {
        return (
            this.x < other.x + other.width &&
            this.x + this.width > other.x &&
            this.y < other.y + other.height &&
            this.y + this.height > other.y
        );
    }

    isInfinite() {
        return (
            Math.abs(this.x) === Infinity ||
            Math.abs(this.y) === Infinity ||
            Math.abs(this.width) === Infinity ||
            Math.abs(this.height) === Infinity
        );
    }

    distanceSquared(point: Point): number {
        if (this.containsPoint(point.x, point.y)) {
            return 0;
        }

        const dx = point.x - clamp(this.x, point.x, this.x + this.width);
        const dy = point.y - clamp(this.y, point.y, this.y + this.height);

        return dx * dx + dy * dy;
    }

    static nearestBox(point: Point, boxes: BBox[]): NearestResult<BBox> {
        return nearestSquared(point, boxes);
    }

    shrink(amounts: Partial<Padding>): this;
    shrink(amount: number, position?: ShrinkOrGrowPosition): this;
    shrink(amount: number | Partial<Padding>, position?: ShrinkOrGrowPosition) {
        const apply = (pos: typeof position, amt: number) => {
            switch (pos) {
                case 'top':
                    this.y += amt;
                // eslint-disable-next-line no-fallthrough
                case 'bottom':
                    this.height -= amt;
                    break;
                case 'left':
                    this.x += amt;
                // eslint-disable-next-line no-fallthrough
                case 'right':
                    this.width -= amt;
                    break;
                case 'vertical':
                    this.y += amt;
                    this.height -= amt * 2;
                    break;
                case 'horizontal':
                    this.x += amt;
                    this.width -= amt * 2;
                    break;
                case undefined:
                    this.x += amt;
                    this.width -= amt * 2;
                    this.y += amt;
                    this.height -= amt * 2;
                    break;
                default:
                // Unknown position - do nothing.
            }
        };

        if (typeof amount === 'number') {
            apply(position, amount);
        } else if (typeof amount === 'object') {
            Object.entries(amount).forEach(([pos, amt]) => apply(pos as typeof position, amt));
        }

        return this;
    }

    grow(amounts: Partial<Padding>): this;
    grow(amount: number, position?: ShrinkOrGrowPosition): this;
    grow(amount: number | Partial<Padding>, position?: ShrinkOrGrowPosition) {
        if (typeof amount === 'number') {
            this.shrink(-amount, position);
        } else {
            const paddingCopy = { ...amount };

            for (const key in paddingCopy) {
                (paddingCopy as any)[key] *= -1;
            }

            this.shrink(paddingCopy);
        }

        return this;
    }

    static merge(boxes: BBox[]) {
        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        boxes.forEach((box) => {
            if (box.x < left) {
                left = box.x;
            }
            if (box.y < top) {
                top = box.y;
            }
            if (box.x + box.width > right) {
                right = box.x + box.width;
            }
            if (box.y + box.height > bottom) {
                bottom = box.y + box.height;
            }
        });
        return new BBox(left, top, right - left, bottom - top);
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
