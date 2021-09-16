import { Path } from "../../scene/shape/path";
import { BBox } from "../../scene/bbox";
import { ShapeLineCap } from "../../scene/shape/shape";

export class RangeMask extends Path {
    static className = 'RangeMask';

    protected _stroke = '#999999';
    protected _strokeWidth = 1;
    protected _fill = '#999999';
    protected _fillOpacity = 0.2;
    protected _lineCap = 'square' as ShapeLineCap;

    protected _x: number = 0;
    set x(value: number) {
        if (this._x !== value) {
            this._x = value;
            this.dirtyPath = true;
        }
    }
    get x(): number {
        return this._x;
    }

    protected _y: number = 0;
    set y(value: number) {
        if (this._y !== value) {
            this._y = value;
            this.dirtyPath = true;
        }
    }
    get y(): number {
        return this._y;
    }

    protected _width: number = 200;
    set width(value: number) {
        if (this._width !== value) {
            this._width = value;
            this.dirtyPath = true;
        }
    }
    get width(): number {
        return this._width;
    }

    protected _height: number = 30;
    set height(value: number) {
        if (this._height !== value) {
            this._height = value;
            this.dirtyPath = true;
        }
    }
    get height(): number {
        return this._height;
    }

    minRange = 0.05;

    protected _min: number = 0;
    set min(value: number) {
        value = Math.min(Math.max(value, 0), this.max - this.minRange);
        if (isNaN(value)) {
            return;
        }
        if (this._min !== value) {
            this._min = value;
            this.dirtyPath = true;
            this.onRangeChange && this.onRangeChange(value, this.max);
        }
    }
    get min(): number {
        return this._min;
    }

    protected _max: number = 1;
    set max(value: number) {
        value = Math.max(Math.min(value, 1), this.min + this.minRange);
        if (isNaN(value)) {
            return;
        }
        if (this._max !== value) {
            this._max = value;
            this.dirtyPath = true;
            this.onRangeChange && this.onRangeChange(this.min, value);
        }
    }
    get max(): number {
        return this._max;
    }

    onRangeChange?: (min: number, max: number) => any;

    computeBBox(): BBox {
        const { x, y, width, height } = this;
        return new BBox(x, y, width, height);
    }

    computeVisibleRangeBBox(): BBox {
        const { x, y, width, height, min, max } = this;
        const minX = x + width * min;
        const maxX = x + width * max;
        return new BBox(minX, y, maxX - minX, height);
    }

    updatePath() {
        const { path, x, y, width, height, min, max } = this;
        const { alignment: a, align: al } = this;

        path.clear();

        const ax = al(a, x);
        const ay = al(a, y);
        const axw = ax + al(a, x, width);
        const ayh = ay + al(a, y, height);

        // Whole range.
        path.moveTo(ax, ay);
        path.lineTo(axw, ay);
        path.lineTo(axw, ayh);
        path.lineTo(ax, ayh);
        path.lineTo(ax, ay);

        const minX = al(a, x + width * min);
        const maxX = al(a, x + width * max);
        // Visible range.
        path.moveTo(minX, ay);
        path.lineTo(minX, ayh);
        path.lineTo(maxX, ayh);
        path.lineTo(maxX, ay);
        path.lineTo(minX, ay);
    }
}