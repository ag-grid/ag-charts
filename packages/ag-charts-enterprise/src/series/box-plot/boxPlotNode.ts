import { _ModuleSupport } from 'ag-charts-community';

const { Path, ExtendedPath2D, SceneChangeDetection, SceneArrayChangeDetection, BBox, clippedRoundRect } =
    _ModuleSupport;

export class BoxPlotNode extends Path {
    private readonly wickPath = new ExtendedPath2D();

    @SceneChangeDetection()
    centerX: number = 0;

    @SceneChangeDetection()
    y: number = 0;

    @SceneChangeDetection()
    width: number = 0;

    @SceneChangeDetection()
    height: number = 0;

    @SceneChangeDetection()
    cornerRadius: number = 0;

    @SceneChangeDetection()
    yQ1: number = 0;

    @SceneChangeDetection()
    yMedian: number = 0;

    @SceneChangeDetection()
    yQ3: number = 0;

    @SceneChangeDetection()
    crisp: boolean = false;

    @SceneChangeDetection()
    strokeAlignment: number = 0;

    @SceneChangeDetection()
    wickStroke: string | undefined = undefined;

    @SceneChangeDetection()
    wickStrokeWidth: number | undefined = undefined;

    @SceneChangeDetection()
    wickStrokeOpacity: number | undefined = undefined;

    @SceneArrayChangeDetection()
    wickLineDash: readonly number[] | undefined;

    @SceneChangeDetection()
    wickLineDashOffset: number | undefined;

    @SceneChangeDetection()
    capLengthRatio: number = 1;

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

        let { centerX, yQ1, yMedian, yQ3 } = this;

        let x0 = centerX - width / 2;
        let x1 = centerX + width / 2;
        let y0 = y;
        let y1 = y + height;

        if (crisp && width > 1) {
            centerX = this.align(centerX);
            yQ1 = this.align(yQ1);
            yQ3 = this.align(yQ3);

            // AG-13372 (1.25dpr comment)
            const halfWidth = this.align(width / 2);
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
        yQ1 += yQ1 < centerY ? strokeAlignment : -strokeAlignment;
        yMedian += yMedian < centerY ? strokeAlignment : -strokeAlignment;
        yQ3 += yQ3 < centerY ? strokeAlignment : -strokeAlignment;

        return { centerX, x0, x1, y0, y1, yQ1, yMedian, yQ3 };
    }

    protected override computeDefaultGradientFillBBox(): _ModuleSupport.BBox | undefined {
        const { width, centerX, yQ1, yQ3 } = this;

        const boxTop = Math.min(yQ1, yQ3);
        const boxBottom = Math.max(yQ1, yQ3);
        const rectHeight = boxBottom - boxTop;

        const x0 = centerX - width / 2;
        const x1 = centerX + width / 2;

        return new BBox(x0, boxTop, x1 - x0, rectHeight);
    }

    override updatePath() {
        const {
            path,
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wickStroke,
            wickStrokeWidth,
            wickStrokeOpacity,
            wickLineDash,
            wickLineDashOffset,
            strokeAlignment,
            cornerRadius,
            capLengthRatio,
        } = this;
        const { centerX, x0, x1, y0, y1, yQ1, yMedian, yQ3 } = this.alignedCoordinates();

        this.path.clear();
        this.wickPath.clear();

        const needsWickPath =
            (wickStroke != null && wickStroke !== stroke) ||
            (wickStrokeWidth != null && wickStrokeWidth !== strokeWidth) ||
            (wickStrokeOpacity != null && wickStrokeOpacity !== strokeOpacity) ||
            (wickLineDash != null && wickLineDash !== lineDash) ||
            (wickLineDashOffset != null && wickLineDashOffset !== lineDashOffset);

        const wickPath = needsWickPath ? this.wickPath : path;

        if (Math.abs(x1 - x0) <= 3) {
            wickPath.moveTo(centerX, y0);
            wickPath.lineTo(centerX, y1);
            return;
        }

        const boxTop = Math.min(yQ1, yQ3);
        const boxBottom = Math.max(yQ1, yQ3);

        const capX0 = centerX - Math.abs((x1 - x0) * capLengthRatio) / 2;
        const capX1 = centerX + Math.abs((x1 - x0) * capLengthRatio) / 2;

        wickPath.moveTo(capX0, y0);
        wickPath.lineTo(capX1, y0);
        wickPath.moveTo(centerX, y0);
        wickPath.lineTo(centerX, boxTop + strokeWidth / 2);

        wickPath.moveTo(centerX, y1);
        wickPath.lineTo(centerX, boxBottom - strokeWidth / 2);
        wickPath.moveTo(capX0, y1);
        wickPath.lineTo(capX1, y1);

        const boxStrokeAdjustment = strokeAlignment + strokeWidth / 2;
        const rectHeight = boxBottom - boxTop - 2 * boxStrokeAdjustment;
        if (rectHeight > 0) {
            const rectX = x0 + boxStrokeAdjustment;
            const rectY = boxTop + boxStrokeAdjustment;
            const rectWidth = x1 - x0 - 2 * boxStrokeAdjustment;
            const cornerRadii = {
                topLeft: cornerRadius,
                topRight: cornerRadius,
                bottomRight: cornerRadius,
                bottomLeft: cornerRadius,
            };
            clippedRoundRect(
                path,
                rectX,
                rectY,
                rectWidth,
                rectHeight,
                cornerRadii,
                new BBox(rectX, rectY, rectWidth, yMedian - rectY)
            );
            clippedRoundRect(
                path,
                rectX,
                rectY,
                rectWidth,
                rectHeight,
                cornerRadii,
                new BBox(rectX, yMedian, rectWidth, rectY + rectHeight - yMedian)
            );
        } else {
            const boxMid = (boxTop + boxBottom) / 2;
            path.moveTo(x0, boxMid);
            path.lineTo(x1, boxMid);
        }
    }

    override drawPath(ctx: _ModuleSupport.CanvasContext) {
        super.drawPath(ctx);

        const { wickPath } = this;
        if (wickPath.isEmpty()) return;

        const {
            stroke,
            strokeWidth,
            strokeOpacity,
            lineDash,
            lineDashOffset,
            wickStroke = stroke,
            wickStrokeWidth = strokeWidth,
            wickStrokeOpacity = strokeOpacity,
            wickLineDash = lineDash,
            wickLineDashOffset = lineDashOffset,
        } = this;

        if (wickStrokeWidth === 0) return;

        ctx.globalAlpha *= wickStrokeOpacity;

        if (typeof wickStroke === 'string') {
            ctx.strokeStyle = wickStroke;
        }
        ctx.lineWidth = wickStrokeWidth;

        if (wickLineDash != null) {
            ctx.setLineDash([...wickLineDash]);
        }
        ctx.lineDashOffset = wickLineDashOffset;

        ctx.stroke(wickPath.getPath2D());
    }
}
