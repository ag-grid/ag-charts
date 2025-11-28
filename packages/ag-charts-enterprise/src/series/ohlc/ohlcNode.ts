import { _ModuleSupport } from 'ag-charts-community';
import type { DistantObject } from 'ag-charts-core';

const { Path, DeclaredSceneChangeDetection, BBox } = _ModuleSupport;

export class OhlcBaseNode<D = any> extends Path<D> implements DistantObject {
    @DeclaredSceneChangeDetection()
    centerX: number = 0;
    declare __centerX: number;

    @DeclaredSceneChangeDetection()
    y: number = 0;
    declare __y: number;

    @DeclaredSceneChangeDetection()
    width: number = 0;
    declare __width: number;

    @DeclaredSceneChangeDetection()
    height: number = 0;
    declare __height: number;

    @DeclaredSceneChangeDetection()
    yOpen: number = 0;
    declare __yOpen: number;

    @DeclaredSceneChangeDetection()
    yClose: number = 0;
    declare __yClose: number;

    @DeclaredSceneChangeDetection()
    crisp: boolean = false;
    declare __crisp: boolean;

    /**
     * High-performance static property setter that bypasses the decorator system entirely.
     * Writes directly to backing fields (__propertyName) to avoid:
     * - Decorator setter chains and equality checks
     * - Multiple onChangeDetection calls per property
     * - Object.keys() iteration in assignIfNotStrictlyEqual
     * - Object allocation overhead
     *
     * A single markDirty() call at the end ensures the scene graph is properly invalidated.
     * WARNING: Only use for hot paths where performance is critical and properties don't need
     * individual change detection (e.g., when updating many nodes in a loop).
     */
    setStaticProperties(
        centerX: number,
        width: number,
        y: number,
        height: number,
        yOpen: number,
        yClose: number,
        crisp: boolean
    ): void {
        // Direct backing field writes bypass SceneChangeDetection decorators
        this.__centerX = centerX;
        this.__width = width;
        this.__y = y;
        this.__height = height;
        this.__yOpen = yOpen;
        this.__yClose = yClose;
        this.__crisp = crisp;

        // Mark path as dirty since crisp affects path rendering
        this.dirtyPath = true;

        // Single dirty notification for the batch
        this.markDirty();
    }

    protected override computeBBox(): _ModuleSupport.BBox | undefined {
        const { __centerX: centerX, __y: y, __width: width, __height: height } = this;
        return new BBox(centerX - width / 2, y, width, height);
    }

    override isPointInPath(x: number, y: number): boolean {
        return this.getBBox().containsPoint(x, y);
    }

    override distanceSquared(x: number, y: number): number {
        return this.getBBox().distanceSquared(x, y);
    }

    get midPoint(): { x: number; y: number } {
        return { x: this.__centerX, y: this.__y + this.__height / 2 };
    }

    protected alignedCoordinates() {
        const { __y: y, __width: width, __height: height, __crisp: crisp } = this;

        let { __centerX: centerX, __yOpen: yOpen, __yClose: yClose } = this;

        let x0 = centerX - width / 2;
        let x1 = centerX + width / 2;
        let y0 = y;
        let y1 = y + height;

        if (crisp && width > 1) {
            centerX = this.align(centerX);
            if (yOpen <= yClose) {
                const h = this.align(yOpen, yClose - yOpen);
                yOpen = this.align(yOpen);
                yClose = yOpen + h;
            } else {
                const h = this.align(yClose, yOpen - yClose);
                yClose = this.align(yClose);
                yOpen = yClose + h;
            }

            // AG-13372 (1.25dpr comment)
            const halfWidth = this.align(width / 2);
            x0 = centerX - halfWidth;
            x1 = centerX + halfWidth;
            y0 = this.align(y);
            y1 = y0 + this.align(y0, height);
        }

        return { centerX, x0, x1, y0, y1, yOpen, yClose };
    }

    protected override executeStroke(ctx: _ModuleSupport.CanvasContext, path?: Path2D): void {
        const { __width: width, strokeWidth } = this;
        if (width < strokeWidth) {
            ctx.lineWidth = width;
        }
        super.executeStroke(ctx, path);
    }
}

export class OhlcNode extends OhlcBaseNode {
    @DeclaredSceneChangeDetection()
    strokeAlignment: number = 0;
    declare __strokeAlignment: number;

    override updatePath() {
        const { path } = this;
        const { centerX, x0, x1, y0, y1, yOpen, yClose } = this.alignedCoordinates();
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const strokeAlignment = this.__strokeAlignment > 0 ? (pixelRatio / this.__strokeAlignment / 2) % 1 : 0;

        path.clear();

        path.moveTo(centerX - strokeAlignment, y0);
        path.lineTo(centerX - strokeAlignment, y1);
        if (Math.abs(x1 - x0) > 1) {
            path.moveTo(x0, yOpen - strokeAlignment);
            path.lineTo(centerX - strokeAlignment, yOpen - strokeAlignment);
            path.moveTo(centerX - strokeAlignment, yClose - strokeAlignment);
            path.lineTo(x1, yClose - strokeAlignment);
        }
    }
}
