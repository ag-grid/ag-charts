import { _ModuleSupport } from 'ag-charts-community';
import { SceneArrayChangeDetection, SceneChangeDetection } from 'ag-charts-core';

const { Path, Scalable, ExtendedPath2D, BBox, clippedRoundRect: baseClippedRoundRect } = _ModuleSupport;

export class BoxPlotNode extends Scalable(Path) {
    private readonly wickPath = new ExtendedPath2D();

    @SceneChangeDetection()
    horizontal: boolean = false;

    @SceneChangeDetection()
    center: number = 0;

    @SceneChangeDetection()
    thickness: number = 0;

    @SceneChangeDetection()
    min: number = 0;

    @SceneChangeDetection()
    q1: number = 0;

    @SceneChangeDetection()
    median: number = 0;

    @SceneChangeDetection()
    q3: number = 0;

    @SceneChangeDetection()
    max: number = 0;

    @SceneChangeDetection()
    cornerRadius: number = 0;

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

    @SceneChangeDetection()
    wickStrokeAlignment: number = 0;

    protected override computeBBox(): _ModuleSupport.BBox | undefined {
        const { horizontal, center, thickness, min, max } = this;
        return horizontal
            ? new BBox(Math.min(min, max), center - thickness / 2, Math.abs(max - min), thickness)
            : new BBox(center - thickness / 2, Math.min(min, max), thickness, Math.abs(max - min));
    }

    override computeDefaultGradientFillBBox(): _ModuleSupport.BBox {
        const { horizontal, center, thickness, q1, q3 } = this;
        return horizontal
            ? new BBox(Math.min(q1, q3), center - thickness / 2, Math.abs(q3 - q1), thickness)
            : new BBox(center - thickness / 2, Math.min(q1, q3), thickness, Math.abs(q3 - q1));
    }

    override isPointInPath(x: number, y: number): boolean {
        return this.getBBox().containsPoint(x, y);
    }

    override distanceSquared(x: number, y: number): number {
        return this.getBBox().distanceSquared(x, y);
    }

    get midPoint(): { x: number; y: number } {
        return this.horizontal
            ? { x: (this.min + this.max) / 2, y: this.center }
            : { x: this.center, y: (this.min + this.max) / 2 };
    }

    protected alignedCoordinates() {
        const { thickness, crisp } = this;

        let { center, min, q1, median, q3, max } = this;

        let x0 = center - thickness / 2;
        let x1 = center + thickness / 2;

        if (crisp && thickness > 1) {
            min = this.align(min);
            q1 = this.align(q1);
            median = this.align(median);
            q3 = this.align(q3);
            max = min + this.align(min, max - min);

            // AG-13372 (1.25dpr comment)
            const halfWidth = this.align(thickness / 2);
            center = this.align(center);
            x0 = center - halfWidth;
            x1 = center + halfWidth;
        }

        return { center, x0, x1, min, max, q1, median, q3 };
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
            horizontal,
        } = this;
        const { center, x0, x1, min, max, q1, median, q3 } = this.alignedCoordinates();
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const wickStrokeAlignment = this.wickStrokeAlignment > 0 ? (pixelRatio / this.wickStrokeAlignment / 2) % 1 : 0;

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
            moveTo(wickPath, horizontal, center, min);
            lineTo(wickPath, horizontal, center, max);
            return;
        }

        const wickTop = Math.min(min, max);
        const wickBottom = Math.max(min, max);
        const boxTop = Math.min(q1, q3);
        const boxBottom = Math.max(q1, q3);

        const capX0 = center - Math.abs((x1 - x0) * capLengthRatio) / 2;
        const capX1 = center + Math.abs((x1 - x0) * capLengthRatio) / 2;

        moveTo(wickPath, horizontal, capX0, wickTop - wickStrokeAlignment);
        lineTo(wickPath, horizontal, capX1, wickTop - wickStrokeAlignment);
        moveTo(wickPath, horizontal, center - wickStrokeAlignment, wickTop - wickStrokeAlignment);
        lineTo(wickPath, horizontal, center - wickStrokeAlignment, boxTop + strokeWidth / 2);

        moveTo(wickPath, horizontal, center - wickStrokeAlignment, wickBottom + wickStrokeAlignment);
        lineTo(wickPath, horizontal, center - wickStrokeAlignment, boxBottom - strokeWidth / 2);
        moveTo(wickPath, horizontal, capX0, wickBottom + wickStrokeAlignment);
        lineTo(wickPath, horizontal, capX1, wickBottom + wickStrokeAlignment);

        const horizontalBoxStrokeAdjustment = strokeWidth / 2 + strokeAlignment;
        const verticalBoxStrokeAdjustment = strokeWidth / 2 - strokeAlignment;
        const rectHeight = boxBottom - boxTop - 2 * verticalBoxStrokeAdjustment;
        if (rectHeight > 0) {
            const rectX = x0 + horizontalBoxStrokeAdjustment;
            const rectY = boxTop + verticalBoxStrokeAdjustment;
            const rectWidth = x1 - x0 - 2 * horizontalBoxStrokeAdjustment;
            const cornerRadii = {
                topLeft: cornerRadius,
                topRight: cornerRadius,
                bottomRight: cornerRadius,
                bottomLeft: cornerRadius,
            };
            clippedRoundRect(
                path,
                horizontal,
                rectX,
                rectY,
                rectWidth,
                rectHeight,
                cornerRadii,
                new BBox(rectX, rectY, rectWidth, median - rectY)
            );
            clippedRoundRect(
                path,
                horizontal,
                rectX,
                rectY,
                rectWidth,
                rectHeight,
                cornerRadii,
                new BBox(rectX, median, rectWidth, rectY + rectHeight - median)
            );
        } else {
            const boxMid = (boxTop + boxBottom) / 2;
            moveTo(path, horizontal, x0, boxMid);
            lineTo(path, horizontal, x1, boxMid);
        }
    }

    override drawPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) {
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

function moveTo(path: _ModuleSupport.ExtendedPath2D, horizontal: boolean, x: number, y: number) {
    if (horizontal) {
        // eslint-disable-next-line sonarjs/arguments-order
        path.moveTo(y, x);
    } else {
        path.moveTo(x, y);
    }
}

function lineTo(path: _ModuleSupport.ExtendedPath2D, horizontal: boolean, x: number, y: number) {
    if (horizontal) {
        // eslint-disable-next-line sonarjs/arguments-order
        path.lineTo(y, x);
    } else {
        path.lineTo(x, y);
    }
}

function clippedRoundRect(
    path: _ModuleSupport.ExtendedPath2D,
    horizontal: boolean,
    x: number,
    y: number,
    width: number,
    height: number,
    cornerRadii: _ModuleSupport.CornerRadii,
    clipBBox: _ModuleSupport.BBox | undefined
) {
    if (horizontal) {
        baseClippedRoundRect(
            // eslint-disable-next-line sonarjs/arguments-order
            path,
            y,
            x,
            height,
            width,
            cornerRadii,
            clipBBox == null ? undefined : new BBox(clipBBox.y, clipBBox.x, clipBBox.height, clipBBox.width)
        );
    } else {
        baseClippedRoundRect(path, x, y, width, height, cornerRadii, clipBBox);
    }
}
