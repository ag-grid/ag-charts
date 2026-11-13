import type { CanvasContext, Logger } from 'ag-charts-core';
import { BBox, DeclaredSceneChangeDetection, ExtendedPath2D, SceneArrayChangeDetection } from 'ag-charts-core';

import { OhlcBaseNode } from '../ohlc/ohlcNode';

export class CandlestickNode<D> extends OhlcBaseNode<D> {
    private readonly wickPath = new ExtendedPath2D();

    constructor() {
        super();
        this.shadowMode = 'silhouette';
    }

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

    protected override computeDefaultGradientFillBBox(): BBox | undefined {
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

    override drawPath(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, logger: Logger) {
        super.drawPath(ctx, logger);

        // A shadow batch's mask draws the wicks as extras, so they would be drawn twice.
        if (!this.isDrawingShadowMask()) {
            this.strokeWicks(ctx);
        }
    }

    protected override getSilhouetteStrokeWidth(): number {
        return Math.max(this.__strokeWidth, this.__wickStrokeWidth ?? 0);
    }

    protected override renderSilhouetteExtras(ctx: CanvasContext) {
        this.strokeWicks(ctx);
    }

    protected override dilateFill(ctx: CanvasContext, _path: Path2D) {
        // Wicks that share the body's path are open, so the fill paints nothing for them and they must not be dilated.
        const { x0, x1, yOpen, yClose } = this.alignedCoordinates();
        if (Math.abs(x1 - x0) <= 3) return;

        const boxStrokeAdjustment = this.strokeWidth / 2;
        const boxTop = Math.min(yOpen, yClose) + boxStrokeAdjustment;
        const rectHeight = Math.abs(yClose - yOpen) - 2 * boxStrokeAdjustment;
        if (rectHeight <= 0) return;

        ctx.beginPath();
        ctx.rect(x0 + boxStrokeAdjustment, boxTop, x1 - x0 - 2 * boxStrokeAdjustment, rectHeight);
        ctx.stroke();
    }

    protected override dilateSilhouetteExtras(ctx: CanvasContext, growth: number) {
        const { wickPath, strokeWidth, __wickStrokeWidth: wickStrokeWidth = strokeWidth } = this;
        if (this.getSilhouetteExtrasOpacity() <= 0) return;

        ctx.lineWidth = wickStrokeWidth + growth;
        ctx.stroke(wickPath.getPath2D());
    }

    private wickColour?: unknown;
    private wickColourAlpha = 1;

    // Keeps the alpha of the last wick colour, so that an unchanged colour isn't parsed again on every render.
    private getWickColourAlpha(colour: unknown): number {
        if (colour !== this.wickColour) {
            this.wickColour = colour;
            this.wickColourAlpha = this.getColourAlpha(colour);
        }
        return this.wickColourAlpha;
    }

    protected override getSilhouetteExtrasOpacity(): number {
        const { wickPath, stroke, strokeWidth, strokeOpacity, __wickStroke: wickStroke = stroke } = this;
        const {
            __wickStrokeWidth: wickStrokeWidth = strokeWidth,
            __wickStrokeOpacity: wickStrokeOpacity = strokeOpacity,
        } = this;
        // A wick casts a shadow only where `strokeWicks` paints it.
        if (wickPath.isEmpty() || wickStrokeWidth === 0 || wickStroke === 'none') return 0;
        return Math.max(0, wickStrokeOpacity) * this.getWickColourAlpha(wickStroke);
    }

    private strokeWicks(ctx: CanvasContext) {
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
