import { BBox } from '../../../scene/bbox';
import { Path } from '../../../scene/shape/path';
import { clamp } from '../../../util/number';
import { ActionOnSet } from '../../../util/proxy';
import { NUMBER, POSITIVE_NUMBER, Validate } from '../../../util/validation';

function markDirtyOnChange(this: RangeMask, newValue: unknown, oldValue: unknown) {
    if (newValue !== oldValue) {
        this.dirtyPath = true;
    }
}

export class RangeMask extends Path {
    static override readonly className = 'RangeMask';

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(POSITIVE_NUMBER)
    x = 0;

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(POSITIVE_NUMBER)
    y = 0;

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(POSITIVE_NUMBER)
    width = 200;

    @ActionOnSet<RangeMask>({ changeValue: markDirtyOnChange })
    @Validate(POSITIVE_NUMBER)
    height = 30;

    readonly minRange = 0.001;

    @Validate(NUMBER)
    protected _min: number = 0;
    set min(value: number) {
        this.setMin(value, true);
    }
    get min(): number {
        return this._min;
    }
    public setMin(value: number, callRangeChangeCallback = false) {
        value = clamp(0, value, this.max - this.minRange);
        if (this._min === value || isNaN(value)) return;

        this._min = value;
        this.dirtyPath = true;
        this.onRangeChange?.(callRangeChangeCallback);
    }

    @Validate(NUMBER)
    protected _max: number = 1;
    set max(value: number) {
        this.setMax(value, true);
    }
    get max(): number {
        return this._max;
    }
    public setMax(value: number, callRangeChangeCallback = false) {
        value = clamp(this.min + this.minRange, value, 1);
        if (this._max === value || isNaN(value)) return;

        this._max = value;
        this.dirtyPath = true;
        this.onRangeChange?.(callRangeChangeCallback);
    }

    onRangeChange?: (callRangeChangeCallback: boolean) => any;

    override computeBBox() {
        const { x, y, width, height } = this;
        return new BBox(x, y, width, height);
    }

    computeVisibleRangeBBox() {
        const { x, y, width, height, min, max } = this;
        const minX = x + width * min;
        const maxX = x + width * max;
        return new BBox(minX, y, maxX - minX, height);
    }

    override updatePath() {
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
