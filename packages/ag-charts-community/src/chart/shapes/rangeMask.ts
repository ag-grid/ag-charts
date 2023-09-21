import { BBox } from '../../scene/bbox';
import { Path } from '../../scene/shape/path';
import type { ShapeLineCap } from '../../scene/shape/shape';
import { clamp } from '../../util/number';
import { ActionOnSet } from '../../util/proxy';
import { COLOR_STRING, LINE_CAP, NUMBER, Validate } from '../../util/validation';

function markDirtyOnChange(this: RangeMask, newValue: unknown, oldValue: unknown) {
    if (newValue !== oldValue) {
        this.dirtyPath = true;
    }
}

export class RangeMask extends Path {
    static className = 'RangeMask';

    @Validate(COLOR_STRING)
    protected _stroke = '#999999';

    @Validate(NUMBER(0))
    protected _strokeWidth = 1;

    @Validate(COLOR_STRING)
    protected _fill = '#999999';

    @Validate(NUMBER(0, 1))
    protected _fillOpacity = 0.2;

    @Validate(LINE_CAP)
    protected _lineCap: ShapeLineCap = 'square';

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(NUMBER(0))
    x = 0;

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(NUMBER(0))
    y = 0;

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(NUMBER(0))
    width = 200;

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(NUMBER(0))
    height = 30;

    readonly minRange = 0.05;

    @Validate(NUMBER())
    protected _min: number = 0;
    set min(value: number) {
        value = clamp(0, value, this.max - this.minRange);
        if (this._min !== value && !isNaN(value)) {
            this._min = value;
            this.dirtyPath = true;
            this.onRangeChange?.();
        }
    }
    get min(): number {
        return this._min;
    }

    @Validate(NUMBER())
    protected _max: number = 1;
    set max(value: number) {
        value = clamp(this.min + this.minRange, value, 1);
        if (this._max !== value && !isNaN(value)) {
            this._max = value;
            this.dirtyPath = true;
            this.onRangeChange?.();
        }
    }
    get max(): number {
        return this._max;
    }

    onRangeChange?: () => any;

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

        path.clear();

        const ax = this.align(x);
        const ay = this.align(y);
        const axw = ax + this.align(x, width);
        const ayh = ay + this.align(y, height);

        // Whole range.
        path.moveTo(ax, ay);
        path.lineTo(axw, ay);
        path.lineTo(axw, ayh);
        path.lineTo(ax, ayh);
        path.lineTo(ax, ay);

        const minX = this.align(x + width * min);
        const maxX = this.align(x + width * max);
        // Visible range.
        path.moveTo(minX, ay);
        path.lineTo(minX, ayh);
        path.lineTo(maxX, ayh);
        path.lineTo(maxX, ay);
        path.lineTo(minX, ay);
    }
}
