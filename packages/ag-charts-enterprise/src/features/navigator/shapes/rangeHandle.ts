import type { CanvasContext, Logger } from 'ag-charts-core';
import { BBox, ExtendedPath2D, Path, SceneChangeDetection } from 'ag-charts-core';

// The grip is a 2×3 grid of dots, drawn at this size on a handle of the reference size (the theme default).
const GRIP_REFERENCE_WIDTH = 12;
const GRIP_REFERENCE_HEIGHT = 24;
const GRIP_RADIUS = 1;
const GRIP_SPACING = 3;
const GRIP_HALF_WIDTH = GRIP_SPACING / 2 + GRIP_RADIUS;
const GRIP_HALF_HEIGHT = GRIP_SPACING + GRIP_RADIUS;

export class RangeHandle extends Path {
    static override readonly className = 'RangeHandle';

    override zIndex = 3;

    private centerX: number = 0;
    private centerY: number = 0;

    @SceneChangeDetection()
    width: number = 8;

    @SceneChangeDetection()
    height: number = 16;

    @SceneChangeDetection()
    cornerRadius: number = 4;

    @SceneChangeDetection()
    grip: boolean = true;

    private readonly gripPath = new ExtendedPath2D();

    setCenter(x: number, y: number) {
        this.dirtyPath = true;
        if (this.centerX !== x || this.centerY !== y) {
            this.centerX = x;
            this.centerY = y;
            this.markDirty('center');
        }
    }

    static align(
        minHandle: RangeHandle,
        maxHandle: RangeHandle,
        x: number,
        y: number,
        width: number,
        height: number,
        min: number,
        max: number,
        pixelAlign: number
    ) {
        const minHandleX = minHandle.align(x + width * min) + pixelAlign;
        const maxHandleX = minHandleX + minHandle.align(x + width * min, width * (max - min)) - 2 * pixelAlign;
        const handleY = minHandle.align(y + height / 2);
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
        const { centerX, centerY, path, gripPath, strokeWidth, cornerRadius, grip } = this;

        const pixelAlign = strokeWidth / 2;
        const pixelRatio = this.layerManager?.canvas?.pixelRatio ?? 1;

        path.clear();
        gripPath.clear();

        const halfWidth = Math.floor((this.width / 2) * pixelRatio) / pixelRatio;
        const halfHeight = Math.floor((this.height / 2) * pixelRatio) / pixelRatio;

        // Handle.
        path.roundRect(
            centerX - halfWidth + pixelAlign,
            centerY - halfHeight + pixelAlign,
            2 * (halfWidth - pixelAlign),
            2 * (halfHeight - pixelAlign),
            cornerRadius
        );

        // Grip
        if (grip) {
            const scale = this.gripScale(halfWidth - strokeWidth, halfHeight - strokeWidth);
            const gripSpacing = GRIP_SPACING * scale;
            const gripRadius = GRIP_RADIUS * scale;
            for (let x = -0.5; x <= 0.5; x += 1) {
                for (let y = -1; y <= 1; y += 1) {
                    gripPath.arc(centerX + x * gripSpacing, centerY + y * gripSpacing, gripRadius, 0, 2 * Math.PI);
                    gripPath.closePath();
                }
            }
        }
    }

    /**
     * One factor for both axes keeps the dots round at any aspect ratio; it is `1` at the 12x24 default size.
     * Capped so the grip stays clear of the border on skewed or thickly stroked handles.
     */
    private gripScale(innerHalfWidth: number, innerHalfHeight: number) {
        const sizeScale = Math.sqrt((this.width / GRIP_REFERENCE_WIDTH) * (this.height / GRIP_REFERENCE_HEIGHT));
        const fitScale = Math.min(innerHalfWidth / GRIP_HALF_WIDTH, innerHalfHeight / GRIP_HALF_HEIGHT);
        return Math.max(0, Math.min(sizeScale, fitScale));
    }

    protected override renderFill(ctx: CanvasContext, logger: Logger, path?: Path2D): void {
        const { stroke } = this;
        super.renderFill(ctx, logger, path);

        ctx.fillStyle = typeof stroke === 'string' ? stroke : 'black';
        ctx.fill(this.gripPath.getPath2D());
    }
}
