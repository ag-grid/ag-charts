import { _ModuleSupport } from 'ag-charts-community';
import { Property } from 'ag-charts-core';

const { Path, BBox, ExtendedPath2D, clippedRoundRect, SceneChangeDetection } = _ModuleSupport;
export class RangeMask<D = any> extends Path<D> {
    static override readonly className = 'RangeMask';

    @Property
    @SceneChangeDetection()
    cornerRadius: number = 4;

    override zIndex = 2;

    private x = 0;
    private y = 0;
    private width = 200;
    private height = 30;
    private min = 0;
    private max = 1;

    private readonly visiblePath = new ExtendedPath2D();

    layout(x: number, y: number, width: number, height: number, min: number, max: number) {
        min = Number.isNaN(min) ? this.min : min;
        max = Number.isNaN(max) ? this.max : max;

        if (
            x !== this.x ||
            y !== this.y ||
            width !== this.width ||
            this.height !== height ||
            min !== this.min ||
            max !== this.max
        ) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.min = min;
            this.max = max;
            this.dirtyPath = true;
            this.markDirty('RangeMask.layout');
        }
    }

    protected override computeBBox() {
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
        const { path, visiblePath, x, y, width, height, min, max, strokeWidth, cornerRadius } = this;
        const pixelAlign = strokeWidth / 2;

        path.clear();
        visiblePath.clear();

        const ax = this.align(x) + pixelAlign;
        const ay = this.align(y) + pixelAlign;
        const aw = this.align(x, width) - 2 * pixelAlign;
        const ah = this.align(y, height) - 2 * pixelAlign;
        const minX = this.align(x + width * min) + pixelAlign;
        const maxX = minX + this.align(x + width * min, width * (max - min)) - 2 * pixelAlign;

        const cornerRadiusParams = {
            topLeft: cornerRadius,
            topRight: cornerRadius,
            bottomRight: cornerRadius,
            bottomLeft: cornerRadius,
        };

        const drawRect = (p: _ModuleSupport.ExtendedPath2D, x0: number, x1: number) => {
            if (x1 - x0 < 1) return;
            const bbox = new BBox(x0, ay, x1 - x0, ah);
            clippedRoundRect(p, ax, ay, aw, ah, cornerRadiusParams, bbox);
        };

        drawRect(path, ax, minX);
        drawRect(path, maxX, aw + ax);
        drawRect(visiblePath, minX, maxX);
    }

    protected override renderStroke(ctx: _ModuleSupport.CanvasContext, path?: Path2D): void {
        super.renderStroke(ctx, path);
        super.renderStroke(ctx, this.visiblePath.getPath2D());
    }
}
