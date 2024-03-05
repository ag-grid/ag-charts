import { BBox } from '../../../scene/bbox';
import { Path } from '../../../scene/shape/path';
import type { ShapeLineCap } from '../../../scene/shape/shape';
import { COLOR_STRING, LINE_CAP, POSITIVE_NUMBER, Validate } from '../../../util/validation';

export class RangeHandle extends Path {
    static override readonly className = 'RangeHandle';

    override zIndex = 3;

    @Validate(COLOR_STRING)
    protected _fill = '#f2f2f2';

    @Validate(COLOR_STRING)
    protected _stroke = '#999999';

    @Validate(POSITIVE_NUMBER)
    protected _strokeWidth = 1;

    @Validate(LINE_CAP)
    protected _lineCap = 'square' as ShapeLineCap;

    protected _centerX: number = 0;
    set centerX(value: number) {
        if (this._centerX !== value) {
            this._centerX = value;
            this.dirtyPath = true;
        }
    }
    get centerX(): number {
        return this._centerX;
    }

    protected _centerY: number = 0;
    set centerY(value: number) {
        if (this._centerY !== value) {
            this._centerY = value;
            this.dirtyPath = true;
        }
    }
    get centerY(): number {
        return this._centerY;
    }

    // Use an even number for better looking results.
    @Validate(POSITIVE_NUMBER)
    protected _width: number = 8;
    set width(value: number) {
        if (this._width !== value) {
            this._width = value;
            this.dirtyPath = true;
        }
    }
    get width(): number {
        return this._width;
    }

    // Use an even number for better looking results.
    @Validate(POSITIVE_NUMBER)
    protected _gripLineGap: number = 2;
    set gripLineGap(value: number) {
        if (this._gripLineGap !== value) {
            this._gripLineGap = value;
            this.dirtyPath = true;
        }
    }
    get gripLineGap(): number {
        return this._gripLineGap;
    }

    // Use an even number for better looking results.
    @Validate(POSITIVE_NUMBER)
    protected _gripLineLength: number = 8;
    set gripLineLength(value: number) {
        if (this._gripLineLength !== value) {
            this._gripLineLength = value;
            this.dirtyPath = true;
        }
    }
    get gripLineLength(): number {
        return this._gripLineLength;
    }

    @Validate(POSITIVE_NUMBER)
    protected _height: number = 16;
    set height(value: number) {
        if (this._height !== value) {
            this._height = value;
            this.dirtyPath = true;
        }
    }
    get height(): number {
        return this._height;
    }

    layout(x: number, y: number) {
        this.centerX = x;
        this.centerY = y;
    }

    override computeBBox() {
        const { centerX, centerY, width, height } = this;
        const x = centerX - width / 2;
        const y = centerY - height / 2;

        return new BBox(x, y, width, height);
    }

    override isPointInPath(x: number, y: number): boolean {
        const point = this.transformPoint(x, y);
        const bbox = this.computeBBox();

        return bbox.containsPoint(point.x, point.y);
    }

    override updatePath() {
        const { path, strokeWidth } = this;
        const pixelAlign = strokeWidth / 2;

        path.clear();

        const halfWidth = this.align(this.width) / 2;
        const halfHeight = this.align(this.height) / 2;
        const centerX = this.align(this.centerX) - (halfWidth % 1);
        const centerY = this.align(this.centerY) - (halfHeight % 1);

        // Handle.
        path.moveTo(centerX - halfWidth + pixelAlign, centerY - halfHeight + pixelAlign);
        path.lineTo(centerX + halfWidth - pixelAlign, centerY - halfHeight + pixelAlign);
        path.lineTo(centerX + halfWidth - pixelAlign, centerY + halfHeight - pixelAlign);
        path.lineTo(centerX - halfWidth + pixelAlign, centerY + halfHeight - pixelAlign);
        path.closePath();

        // Grip lines.
        const dx = this.gripLineGap / 2;
        const dy = this.gripLineLength / 2;
        path.moveTo(centerX - dx - pixelAlign, centerY - dy);
        path.lineTo(centerX - dx - pixelAlign, centerY + dy);
        path.moveTo(centerX + dx + pixelAlign, centerY - dy);
        path.lineTo(centerX + dx + pixelAlign, centerY + dy);
    }
}
