import { _ModuleSupport } from 'ag-charts-community';
import { Property, SceneChangeDetection } from 'ag-charts-core';

const { BBox, ExtendedPath2D } = _ModuleSupport;
export class RangeHandle extends _ModuleSupport.Path {
    static override readonly className = 'RangeHandle';

    override zIndex = 3;

    private centerX: number = 0;
    private centerY: number = 0;

    @Property
    @SceneChangeDetection()
    width: number = 8;

    @Property
    @SceneChangeDetection()
    height: number = 16;

    @Property
    @SceneChangeDetection()
    cornerRadius: number = 4;

    @Property
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
        const gripSpacing = 3;
        if (grip) {
            for (let x = -0.5; x <= 0.5; x += 1) {
                for (let y = -1; y <= 1; y += 1) {
                    gripPath.arc(centerX + x * gripSpacing, centerY + y * gripSpacing, 1, 0, 2 * Math.PI);
                    gripPath.closePath();
                }
            }
        }
    }

    protected override renderFill(ctx: _ModuleSupport.CanvasContext, path?: Path2D): void {
        const { stroke } = this;
        super.renderFill(ctx, path);

        ctx.fillStyle = typeof stroke === 'string' ? stroke : 'black';
        ctx.fill(this.gripPath.getPath2D());
    }
}
