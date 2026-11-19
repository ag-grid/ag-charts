import type { CanvasContext, Logger } from 'ag-charts-core';
import { BBox, ExtendedPath2D, Path, SceneChangeDetection } from 'ag-charts-core';

// The grip is a 2×3 grid of dots, drawn at this size on a handle of the reference size (the theme default).
const GRIP_REFERENCE_WIDTH = 12;
const GRIP_REFERENCE_HEIGHT = 24;
const GRIP_RADIUS = 1;
const GRIP_SPACING = 3;
const GRIP_HALF_WIDTH = GRIP_SPACING / 2 + GRIP_RADIUS;
const GRIP_HALF_HEIGHT = GRIP_SPACING + GRIP_RADIUS;
// Halving 16 times narrows the fit to 1/65536 of the full-size scale, well under a device pixel.
const GRIP_FIT_ITERATIONS = 16;

interface GripScaleInput {
    width: number;
    height: number;
    /** The half-size the handle is drawn at, which can be rounded down to a device pixel. */
    halfWidth: number;
    halfHeight: number;
    strokeWidth: number;
    cornerRadius: number;
}

/**
 * One factor for both axes keeps the dots round at any aspect ratio; it is `1` at the theme's default handle size
 * (`NAVIGATOR_HANDLE_THEME`), not the class field defaults.
 * Capped so the grip fits inside the stroke, including its rounded corners.
 */
function gripScale({ width, height, halfWidth, halfHeight, strokeWidth, cornerRadius }: GripScaleInput) {
    const innerHalfWidth = halfWidth - strokeWidth;
    const innerHalfHeight = halfHeight - strokeWidth;
    const pathRadius = Math.min(cornerRadius, halfWidth - strokeWidth / 2, halfHeight - strokeWidth / 2);
    const innerRadius = Math.max(0, pathRadius - strokeWidth / 2);
    const arcCenterX = innerHalfWidth - innerRadius;
    const arcCenterY = innerHalfHeight - innerRadius;

    // The outer dots are the extremes. A disc inside a convex shape stays inside when scaled about its centre, so
    // the fitting scales are an interval `[0, max]`.
    const fits = (scale: number) => {
        if (GRIP_HALF_WIDTH * scale > innerHalfWidth || GRIP_HALF_HEIGHT * scale > innerHalfHeight) return false;
        const dx = (GRIP_SPACING / 2) * scale - arcCenterX;
        const dy = GRIP_SPACING * scale - arcCenterY;
        return dx <= 0 || dy <= 0 || Math.hypot(dx, dy) + GRIP_RADIUS * scale <= innerRadius;
    };

    let high = Math.sqrt((width / GRIP_REFERENCE_WIDTH) * (height / GRIP_REFERENCE_HEIGHT));
    if (fits(high)) return high;

    let low = 0;
    for (let i = 0; i < GRIP_FIT_ITERATIONS; i++) {
        const mid = (low + high) / 2;
        if (fits(mid)) low = mid;
        else high = mid;
    }
    return low;
}

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
            const scale = gripScale({
                width: this.width,
                height: this.height,
                halfWidth,
                halfHeight,
                strokeWidth,
                cornerRadius,
            });
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

    protected override renderFill(ctx: CanvasContext, logger: Logger, path?: Path2D): void {
        const { stroke } = this;
        super.renderFill(ctx, logger, path);

        ctx.fillStyle = typeof stroke === 'string' ? stroke : 'black';
        ctx.fill(this.gripPath.getPath2D());
    }
}
