import { BBox } from '../../../scene/bbox';
import { RedrawType, SceneChangeDetection } from '../../../scene/changeDetectable';
import { Path } from '../../../scene/shape/path';
import { POSITIVE_NUMBER, Validate } from '../../../util/validation';

export class RangeHandle extends Path {
    static override readonly className = 'RangeHandle';

    override zIndex = 3;

    protected centerX: number = 0;
    protected centerY: number = 0;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR, type: 'path' })
    width: number = 8;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR, type: 'path' })
    height: number = 16;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR, type: 'path' })
    gripLineGap: number = 2;

    @Validate(POSITIVE_NUMBER)
    @SceneChangeDetection({ redraw: RedrawType.MAJOR, type: 'path' })
    gripLineLength: number = 8;

    setCenter(x: number, y: number) {
        this.dirtyPath = true;
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
        minHandle.setCenter(minHandleX, handleY);
        maxHandle.setCenter(maxHandleX, handleY);
    }

    protected override computeBBox() {
        const { centerX, centerY, width, height } = this;
        const x = centerX - width / 2;
        const y = centerY - height / 2;

        return new BBox(x, y, width, height);
    }

    override isPointInPath(x: number, y: number): boolean {
        const bbox = this.getBBox();

        return bbox.containsPoint(x, y);
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
