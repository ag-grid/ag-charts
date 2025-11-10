import { _ModuleSupport } from 'ag-charts-community';
import type { DistantObject } from 'ag-charts-core';

const { Path, SceneChangeDetection, BBox } = _ModuleSupport;

export class OhlcBaseNode<D = any> extends Path<D> implements DistantObject {
    @SceneChangeDetection()
    centerX: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    @SceneChangeDetection()
    width: number = 0;

    @SceneChangeDetection()
    height: number = 0;

    @SceneChangeDetection()
    yOpen: number = 0;

    @SceneChangeDetection()
    yClose: number = 0;

    @SceneChangeDetection()
    crisp: boolean = false;

    protected override computeBBox(): _ModuleSupport.BBox | undefined {
        const { centerX, y, width, height } = this;
        return new BBox(centerX - width / 2, y, width, height);
    }

    override isPointInPath(x: number, y: number): boolean {
        return this.getBBox().containsPoint(x, y);
    }

    override distanceSquared(x: number, y: number): number {
        return this.getBBox().distanceSquared(x, y);
    }

    get midPoint(): { x: number; y: number } {
        return { x: this.centerX, y: this.y + this.height / 2 };
    }

    protected alignedCoordinates() {
        const { y, width, height, crisp } = this;

        let { centerX, yOpen, yClose } = this;

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
        const { width, strokeWidth } = this;
        if (width < strokeWidth) {
            ctx.lineWidth = width;
        }
        super.executeStroke(ctx, path);
    }
}

export class OhlcNode extends OhlcBaseNode {
    @SceneChangeDetection()
    strokeAlignment: number = 0;

    override updatePath() {
        const { path } = this;
        const { centerX, x0, x1, y0, y1, yOpen, yClose } = this.alignedCoordinates();
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const strokeAlignment = this.strokeAlignment > 0 ? (pixelRatio / this.strokeAlignment / 2) % 1 : 0;

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
