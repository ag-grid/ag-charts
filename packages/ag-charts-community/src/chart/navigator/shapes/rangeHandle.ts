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

    static align(
        minHandle: RangeHandle,
        maxHandle: RangeHandle,
        x: number,
        y: number,
        width: number,
        height: number,
        min: number,
        max: number
    ) {
        const handlePixelAlign = minHandle.strokeWidth / 2;
        const minHandleX = minHandle.align(x + width * min) + handlePixelAlign;
        const maxHandleX = minHandleX + minHandle.align(x + width * min, width * (max - min)) - 2 * handlePixelAlign;
        const handleY = minHandle.align(y + height / 2) + handlePixelAlign;
        minHandle.layout(minHandleX, handleY);
        maxHandle.layout(maxHandleX, handleY);
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
        const { centerX, centerY, path, strokeWidth, gripLineGap, gripLineLength } = this;
        const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;

        path.clear();

        const halfWidth = Math.floor((this.width / 2) * pixelRatio) / pixelRatio;
        const halfHeight = Math.floor((this.height / 2) * pixelRatio) / pixelRatio;

        // Handle.
        path.moveTo(centerX - halfWidth, centerY - halfHeight);
        path.lineTo(centerX + halfWidth, centerY - halfHeight);
        path.lineTo(centerX + halfWidth, centerY + halfHeight);
        path.lineTo(centerX - halfWidth, centerY + halfHeight);
        path.closePath();

        // Grip lines.
        const dx = Math.floor(((gripLineGap + strokeWidth) / 2) * pixelRatio) / pixelRatio;
        const dy = Math.floor((gripLineLength / 2) * pixelRatio) / pixelRatio;
        path.moveTo(centerX - dx, centerY - dy);
        path.lineTo(centerX - dx, centerY + dy);
        path.moveTo(centerX + dx, centerY - dy);
        path.lineTo(centerX + dx, centerY + dy);
    }
}
