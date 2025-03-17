import { _ModuleSupport } from 'ag-charts-community';

import { OhlcBaseNode } from '../ohlc/ohlcNode';

const { SceneChangeDetection, ExtendedPath2D, BBox } = _ModuleSupport;

export class CandlestickNode extends OhlcBaseNode {
    private readonly wickPath = new ExtendedPath2D();

    @SceneChangeDetection()
    wickStroke: string | undefined = undefined;

    @SceneChangeDetection()
    wickStrokeWidth: number | undefined = undefined;

    @SceneChangeDetection()
    wickStrokeOpacity: number | undefined = undefined;

    @SceneChangeDetection()
    wickLineDash: number[] | undefined;

    @SceneChangeDetection()
    wickLineDashOffset: number | undefined;

    protected override computeDefaultGradientFillBBox(): _ModuleSupport.BBox | undefined {
        const { width, centerX, yOpen, yClose } = this;

        const boxTop = Math.min(yOpen, yClose);
        const boxBottom = Math.max(yOpen, yClose);
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
        } = this;
        const { centerX, x0, x1, y0, y1, yOpen, yClose } = this.alignedCoordinates();

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

        const boxTop = Math.min(yOpen, yClose);
        const boxBottom = Math.max(yOpen, yClose);

        wickPath.moveTo(centerX, y0);
        wickPath.lineTo(centerX, boxTop + strokeWidth / 2);

        wickPath.moveTo(centerX, y1);
        wickPath.lineTo(centerX, boxBottom - strokeWidth / 2);

        const boxStrokeAdjustment = strokeAlignment + strokeWidth / 2;
        const rectHeight = boxBottom - boxTop - 2 * boxStrokeAdjustment;
        if (rectHeight > 0) {
            path.rect(
                x0 + boxStrokeAdjustment,
                boxTop + boxStrokeAdjustment,
                x1 - x0 - 2 * boxStrokeAdjustment,
                rectHeight
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
            ctx.setLineDash(wickLineDash);
        }
        ctx.lineDashOffset = wickLineDashOffset;

        ctx.stroke(wickPath.getPath2D());
    }
}
