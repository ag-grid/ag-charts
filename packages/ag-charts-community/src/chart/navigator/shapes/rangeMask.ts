import { BBox } from '../../../scene/bbox';
import { Path } from '../../../scene/shape/path';

export class RangeMask extends Path {
    static override readonly className = 'RangeMask';

    override zIndex = 2;

    private x = 0;
    private y = 0;
    private width = 200;
    private height = 30;
    private min = 0;
    private max = 1;

    layout(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.dirtyPath = true;
    }

    update(min: number, max: number) {
        this.min = isNaN(min) ? this.min : min;
        this.max = isNaN(max) ? this.max : max;
        this.dirtyPath = true;
    }

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
        const { path, x, y, width, height, min, max, strokeWidth } = this;
        const pixelAlign = strokeWidth / 2;

        path.clear();

        const ax = this.align(x) + pixelAlign;
        const ay = this.align(y) + pixelAlign;
        const axw = ax + this.align(x, width) - 2 * pixelAlign;
        const ayh = ay + this.align(y, height) - 2 * pixelAlign;

        // Whole range.
        path.moveTo(ax, ay);
        path.lineTo(axw, ay);
        path.lineTo(axw, ayh);
        path.lineTo(ax, ayh);
        path.closePath();

        const minX = this.align(x + width * min) - pixelAlign;
        const maxX = this.align(x + width * max) - pixelAlign;
        // Visible range.
        path.moveTo(minX, ay);
        path.lineTo(minX, ayh);
        path.lineTo(maxX, ayh);
        path.lineTo(maxX, ay);
        path.closePath();
    }
}
