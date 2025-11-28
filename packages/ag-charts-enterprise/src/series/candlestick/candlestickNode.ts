import { _ModuleSupport } from 'ag-charts-community';

import { OhlcBaseNode } from '../ohlc/ohlcNode';

const { SceneArrayChangeDetection, DeclaredSceneChangeDetection, ExtendedPath2D, BBox } = _ModuleSupport;

export class CandlestickNode extends OhlcBaseNode {
    private readonly wickPath = new ExtendedPath2D();

    @DeclaredSceneChangeDetection()
    wickStroke: string | undefined = undefined;
    declare __wickStroke: string | undefined;

    @DeclaredSceneChangeDetection()
    wickStrokeWidth: number | undefined = undefined;
    declare __wickStrokeWidth: number | undefined;

    @DeclaredSceneChangeDetection()
    wickStrokeOpacity: number | undefined = undefined;
    declare __wickStrokeOpacity: number | undefined;

    @SceneArrayChangeDetection()
    wickLineDash: readonly number[] | undefined;

    @DeclaredSceneChangeDetection()
    wickLineDashOffset: number | undefined;
    declare __wickLineDashOffset: number | undefined;

    @DeclaredSceneChangeDetection()
    wickStrokeAlignment: number = 0;
    declare __wickStrokeAlignment: number;

    /**
     * High-performance wick property setter that bypasses the decorator system entirely.
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
    setWickProperties(
        wickStroke: string | undefined,
        wickStrokeWidth: number | undefined,
        wickStrokeOpacity: number | undefined,
        wickLineDash: readonly number[] | undefined,
        wickLineDashOffset: number | undefined
    ): void {
        // Direct backing field writes bypass SceneChangeDetection decorators
        this.__wickStroke = wickStroke;
        this.__wickStrokeWidth = wickStrokeWidth;
        this.__wickStrokeOpacity = wickStrokeOpacity;
        this.wickLineDash = wickLineDash; // Array detection decorator doesn't have backing field
        this.__wickLineDashOffset = wickLineDashOffset;

        // Mark path as dirty since wick properties affect path rendering
        this.dirtyPath = true;

        // Single dirty notification for the batch
        this.markDirty();
    }

    protected override computeDefaultGradientFillBBox(): _ModuleSupport.BBox | undefined {
        const { __width: width, __centerX: centerX, __yOpen: yOpen, __yClose: yClose } = this;

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
            __wickStroke: wickStroke,
            __wickStrokeWidth: wickStrokeWidth,
            __wickStrokeOpacity: wickStrokeOpacity,
            wickLineDash,
            __wickLineDashOffset: wickLineDashOffset,
        } = this;
        const { centerX, x0, x1, y0, y1, yOpen, yClose } = this.alignedCoordinates();
        const pixelRatio = this.layerManager?.canvas.pixelRatio ?? 1;
        const wickStrokeAlignment =
            this.__wickStrokeAlignment > 0 ? (pixelRatio / this.__wickStrokeAlignment / 2) % 1 : 0;

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
            wickPath.moveTo(centerX - wickStrokeAlignment, y0);
            wickPath.lineTo(centerX - wickStrokeAlignment, y1);
            return;
        }

        const boxTop = Math.min(yOpen, yClose);
        const boxBottom = Math.max(yOpen, yClose);
        const boxStrokeAdjustment = strokeWidth / 2;

        wickPath.moveTo(centerX - wickStrokeAlignment, y0);
        wickPath.lineTo(centerX - wickStrokeAlignment, boxTop + boxStrokeAdjustment);

        wickPath.moveTo(centerX - wickStrokeAlignment, y1);
        wickPath.lineTo(centerX - wickStrokeAlignment, boxBottom - boxStrokeAdjustment);

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
            __wickStroke: wickStroke = stroke,
            __wickStrokeWidth: wickStrokeWidth = strokeWidth,
            __wickStrokeOpacity: wickStrokeOpacity = strokeOpacity,
            wickLineDash = lineDash,
            __wickLineDashOffset: wickLineDashOffset = lineDashOffset,
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
