import { _ModuleSupport } from 'ag-charts-community';

const { Path, ScenePathChangeDetection, BBox } = _ModuleSupport;

export class OhlcBaseNode extends Path implements _ModuleSupport.DistantObject {
    @ScenePathChangeDetection()
    centerX: number = 0;

    @ScenePathChangeDetection()
    y: number = 0;

    @ScenePathChangeDetection()
    width: number = 0;

    @ScenePathChangeDetection()
    height: number = 0;

    @ScenePathChangeDetection()
    yOpen: number = 0;

    @ScenePathChangeDetection()
    yClose: number = 0;

    @ScenePathChangeDetection()
    crisp: boolean = false;

    @ScenePathChangeDetection()
    strokeAlignment: number = 0;

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
        const { y, width, height, crisp, strokeAlignment } = this;

        let { centerX, yOpen, yClose } = this;

        let x0 = centerX - width / 2;
        let x1 = centerX + width / 2;
        let y0 = y;
        let y1 = y + height;

        if (crisp && width > 1) {
            centerX = this.align(centerX);
            yOpen = this.align(yOpen);
            yClose = this.align(yClose);

            const halfWidth = this.align(centerX, width / 2);
            x0 = centerX - halfWidth;
            x1 = centerX + halfWidth;
            y0 = this.align(y);
            y1 = y0 + this.align(y0, height);
        }

        const centerY = (y0 + y1) / 2;

        // Align to an assumed 1px stroke width
        centerX += strokeAlignment;
        x0 += strokeAlignment;
        x1 += strokeAlignment;
        y0 -= strokeAlignment;
        y1 += strokeAlignment;
        yOpen += yOpen < centerY ? strokeAlignment : -strokeAlignment;
        yClose += yClose < centerY ? strokeAlignment : -strokeAlignment;

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
    override updatePath() {
        const { path } = this;
        const { centerX, x0, x1, y0, y1, yOpen, yClose } = this.alignedCoordinates();

        path.clear();

        path.moveTo(centerX, y0);
        path.lineTo(centerX, y1);
        if (Math.abs(x1 - x0) > 1) {
            path.moveTo(x0, yOpen);
            path.lineTo(centerX, yOpen);
            path.moveTo(centerX, yClose);
            path.lineTo(x1, yClose);
        }
    }
}
